import { describe, expect, it } from 'vitest';

import { ChessEngine } from './engine';
import { resolveTimeout } from './status';
import type { Square } from './types';

const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type MoveInput = { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' };

function playMoves(engine: ChessEngine, moves: readonly MoveInput[]): void {
  for (const move of moves) {
    const result = engine.play(move);

    if (!result.ok) {
      throw new Error(`lance ilegal na sequência: ${move.from}${move.to} (${result.reason})`);
    }
  }
}

describe('ChessEngine', () => {
  describe('criação e estado inicial', () => {
    it('start() começa na posição inicial com as brancas', () => {
      const engine = ChessEngine.start();

      expect(engine.fen()).toBe(INITIAL_FEN);
      expect(engine.turn()).toBe('w');
      expect(engine.getInitialFen()).toBe(INITIAL_FEN);
      expect(engine.getInitialFullMoveNumber()).toBe(1);
      expect(engine.isFinished()).toBe(false);
      expect(engine.legalMoves('e2')).toContainEqual(
        expect.objectContaining({ from: 'e2', to: 'e4', san: 'e4' }),
      );
      expect(engine.legalMoves()).toHaveLength(20);
      expect(engine.pieceAt('e2')).toEqual({ type: 'p', color: 'w' });
      expect(engine.pieceAt('e7')).toEqual({ type: 'p', color: 'b' });
    });

    it('fromFen carrega posição informada', () => {
      const engine = ChessEngine.fromFen('8/P7/8/8/8/8/8/K6k w - - 0 1');

      expect(engine.turn()).toBe('w');
      expect(engine.pieceAt('a7')).toEqual({ type: 'p', color: 'w' });
      expect(engine.pieceAt('h1')).toEqual({ type: 'k', color: 'b' });
    });

    it('fromFen com FEN inválido lança erro de código invalid-fen', () => {
      const engine = ChessEngine.start();

      expect(() => engine.loadFen('não é um FEN')).toThrowError(
        expect.objectContaining({ code: 'invalid-fen' }),
      );
      expect(engine.fen()).toBe(INITIAL_FEN);
    });

    it('reset() volta para a posição inicial', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
      ]);

      engine.reset();

      expect(engine.fen()).toBe(INITIAL_FEN);
      expect(engine.turn()).toBe('w');
      expect(engine.history()).toHaveLength(0);
    });
  });

  describe('lances', () => {
    it('executa um lance legal e retorna o registro', () => {
      const engine = ChessEngine.start();
      const result = engine.play({ from: 'e2', to: 'e4' });

      expect(result.ok).toBe(true);
      const move = result.ok ? result.move : null;

      expect(move!.san).toBe('e4');
      expect(move!.from).toBe('e2');
      expect(move!.to).toBe('e4');
      expect(move!.color).toBe('w');
      expect(move!.piece).toBe('p');
      expect(move!.flags.bigPawn).toBe(true);
      expect(move!.flags.capture).toBe(false);
      expect(move!.fenBefore).toBe(INITIAL_FEN);
      expect(move!.fenAfter).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      );
      expect(engine.turn()).toBe('b');
      expect(engine.history()).toHaveLength(1);
    });

    it('rejeita lance ilegal sem alterar o estado', () => {
      const engine = ChessEngine.start();

      const result = engine.play({ from: 'e7', to: 'e5' });

      expect(result.ok).toBe(false);
      expect(result.ok ? null : result.reason).toBe('illegal-move');
      expect(engine.fen()).toBe(INITIAL_FEN);
      expect(engine.turn()).toBe('w');
      expect(engine.history()).toHaveLength(0);
    });

    it('promoção exige peça escolhida', () => {
      const engine = ChessEngine.fromFen('8/P7/8/8/8/8/8/K6k w - - 0 1');

      const without = engine.play({ from: 'a7', to: 'a8' });
      expect(without.ok).toBe(false);
      expect(without.ok ? null : without.reason).toBe('illegal-move');

      const withPromotion = engine.play({ from: 'a7', to: 'a8', promotion: 'q' });
      expect(withPromotion.ok).toBe(true);
      expect(withPromotion.ok ? withPromotion.move.flags.promotion : false).toBe(
        true,
      );
      expect(withPromotion.ok ? withPromotion.move.promotion : null).toBe('q');
      expect(engine.pieceAt('a8')).toEqual({ type: 'q', color: 'w' });
      expect(engine.pieceAt('a7')).toBeNull();
    });

    it('promoção aceita torre, bispo e cavalo', () => {
      const base = '8/P7/8/8/8/8/8/K6k w - - 0 1';

      for (const promotion of ['r', 'b', 'n'] as const) {
        const engine = ChessEngine.fromFen(base);
        const result = engine.play({ from: 'a7', to: 'a8', promotion });

        expect(result.ok).toBe(true);
        expect(engine.pieceAt('a8')).toEqual({ type: promotion, color: 'w' });
      }
    });

    it('captura', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'g8', to: 'f6' },
        { from: 'f3', to: 'e5' },
      ]);

      const last = engine.history().at(-1)!;

      expect(last.flags.capture).toBe(true);
      expect(last.captured).toBe('p');
      expect(last.san).toBe('Nxe5');
      expect(engine.pieceAt('e5')).toEqual({ type: 'n', color: 'w' });
      expect(engine.pieceAt('f3')).toBeNull();
    });

    it('roque grande', () => {
      const engine = ChessEngine.fromFen(
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      );
      const result = engine.play({ from: 'e1', to: 'c1' });

      expect(result.ok).toBe(true);
      expect(result.ok ? result.move.flags.queensideCastle : false).toBe(true);
      expect(engine.pieceAt('c1')).toEqual({ type: 'k', color: 'w' });
      expect(engine.pieceAt('d1')).toEqual({ type: 'r', color: 'w' });
      expect(engine.pieceAt('e1')).toBeNull();
      expect(engine.pieceAt('a1')).toBeNull();
    });

    it('roque pequeno', () => {
      const engine = ChessEngine.fromFen(
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      );
      const result = engine.play({ from: 'e1', to: 'g1' });

      expect(result.ok).toBe(true);
      expect(result.ok ? result.move.flags.kingsideCastle : false).toBe(true);
      expect(engine.pieceAt('g1')).toEqual({ type: 'k', color: 'w' });
      expect(engine.pieceAt('f1')).toEqual({ type: 'r', color: 'w' });
    });

    it('en passant', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'g8', to: 'f6' },
        { from: 'd2', to: 'd4' },
        { from: 'e5', to: 'd4' },
        { from: 'e4', to: 'e5' },
        { from: 'f6', to: 'g4' },
        { from: 'd1', to: 'd4' },
        { from: 'd7', to: 'd5' },
      ]);
      const result = engine.play({ from: 'e5', to: 'd6' });

      expect(result.ok).toBe(true);
      expect(result.ok ? result.move.flags.enPassant : false).toBe(true);
      expect(result.ok ? result.move.captured : null).toBe('p');
      expect(result.ok ? result.move.san : null).toBe('exd6');
      expect(engine.pieceAt('d6')).toEqual({ type: 'p', color: 'w' });
      expect(engine.pieceAt('e5')).toBeNull();
      expect(engine.pieceAt('d5')).toBeNull();
    });

    it('legalMoves filtra por origem', () => {
      const engine = ChessEngine.start();

      const moves = engine.legalMoves('e2');

      expect(moves.some((move) => move.to === 'e4')).toBe(true);
      expect(moves.some((move) => move.to === 'e3')).toBe(true);
      expect(moves.every((move) => move.from === 'e2')).toBe(true);
    });
  });

  describe('status da partida', () => {
    it('xeque', () => {
      const engine = ChessEngine.fromFen('4k3/8/8/8/8/8/8/4R2K b - - 0 1');

      expect(engine.status().status).toEqual({ kind: 'playing', check: true });
      expect(engine.turn()).toBe('b');
    });

    it('xeque-mate encerra a partida com vencedor', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'd1', to: 'h5' },
        { from: 'b8', to: 'c6' },
        { from: 'f1', to: 'c4' },
        { from: 'g8', to: 'f6' },
        { from: 'h5', to: 'f7' },
      ]);

      const status = engine.status();

      expect(status.status).toEqual({
        kind: 'finished',
        result: { kind: 'checkmate', winner: 'w' },
      });
      expect(engine.isFinished()).toBe(true);

      const rejected = engine.play({ from: 'e8', to: 'd7' });
      expect(rejected.ok).toBe(false);
      expect(rejected.ok ? null : rejected.reason).toBe('game-over');
    });

    it('afogamento é empate automático', () => {
      const engine = ChessEngine.fromFen(
        'k7/8/K7/8/8/8/1Q6/8 b - - 0 1',
      );

      const status = engine.status();

      expect(status.status).toEqual({
        kind: 'finished',
        result: { kind: 'draw', reason: 'stalemate' },
      });
    });

    it('material insuficiente é empate automático', () => {
      const engine = ChessEngine.fromFen('k7/8/8/8/8/8/8/K7 w - - 0 1');

      const status = engine.status();

      expect(status.status).toEqual({
        kind: 'finished',
        result: { kind: 'draw', reason: 'insufficient-material' },
      });
      expect(status.details.insufficientMaterial).toBe(true);
    });

    it('cavalo mais rei contra rei também é material insuficiente', () => {
      const engine = ChessEngine.fromFen(
        '8/8/8/8/8/8/N7/K6k w - - 0 1',
      );

      expect(engine.status().details.insufficientMaterial).toBe(true);
      expect(engine.status().status.kind).toBe('finished');
    });
  });

  describe('empates reivindicáveis vs automáticos', () => {
    it('repetição tripla é reivindicável, não encerra a partida', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'g1', to: 'f3' },
        { from: 'g8', to: 'f6' },
        { from: 'f3', to: 'g1' },
        { from: 'f6', to: 'g8' },
        { from: 'g1', to: 'f3' },
        { from: 'g8', to: 'f6' },
        { from: 'f3', to: 'g1' },
        { from: 'f6', to: 'g8' },
      ]);

      const status = engine.status();

      expect(status.status.kind).toBe('playing');
      expect(status.claims).toContain('threefold-repetition');
      expect(status.claims).not.toContain('fivefold-repetition');
      expect(status.details.repetitionCount).toBe(3);
      expect(engine.isFinished()).toBe(false);
    });

    it('repetição quíntupla encerra automaticamente', () => {
      const engine = ChessEngine.start();
      const cycle: readonly MoveInput[] = [
        { from: 'g1', to: 'f3' },
        { from: 'g8', to: 'f6' },
        { from: 'f3', to: 'g1' },
        { from: 'f6', to: 'g8' },
      ];

      for (let i = 0; i < 4; i += 1) {
        playMoves(engine, cycle);
      }

      const status = engine.status();

      expect(status.status).toEqual({
        kind: 'finished',
        result: { kind: 'draw', reason: 'fivefold-repetition' },
      });
      expect(engine.isFinished()).toBe(true);
    });

    it('regra dos 50 lances é reivindicável', () => {
      const engine = ChessEngine.fromFen(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 100 1',
      );

      const status = engine.status();

      expect(status.status.kind).toBe('playing');
      expect(status.claims).toContain('fifty-move-rule');
      expect(status.details.halfmoveClock).toBe(100);
    });

    it('regra dos 75 lances é automática', () => {
      const engine = ChessEngine.fromFen(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 150 1',
      );

      const status = engine.status();

      expect(status.status).toEqual({
        kind: 'finished',
        result: { kind: 'draw', reason: 'seventy-five-move-rule' },
      });
    });

    it('xeque-mate tem precedência sobre regras automáticas', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'd1', to: 'h5' },
        { from: 'b8', to: 'c6' },
        { from: 'f1', to: 'c4' },
        { from: 'g8', to: 'f6' },
        { from: 'h5', to: 'f7' },
      ]);

      expect(engine.status().status).toEqual({
        kind: 'finished',
        result: { kind: 'checkmate', winner: 'w' },
      });
    });
  });

  describe('tempo (timeout)', () => {
    it('material insuficiente em timeout é empate', () => {
      expect(resolveTimeout('w', true)).toEqual({
        kind: 'draw',
        reason: 'insufficient-material',
      });
    });

    it('timeout sem material insuficiente vence o adversário', () => {
      expect(resolveTimeout('w', false)).toEqual({
        kind: 'timeout',
        winner: 'b',
      });
    });
  });

  describe('histórico e desfa­zer', () => {
    it('history retorna registros completos', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
      ]);

      const history = engine.history();

      expect(history).toHaveLength(3);
      expect(history[0]!).toMatchObject({
        san: 'e4',
        from: 'e2',
        to: 'e4',
        color: 'w',
        piece: 'p',
      });
      expect(history[1]!).toMatchObject({ san: 'e5', color: 'b' });
      expect(history[2]!).toMatchObject({ san: 'Nf3', color: 'w' });
      expect(history.every((move) => typeof move.fenBefore === 'string')).toBe(
        true,
      );
      expect(history.every((move) => typeof move.fenAfter === 'string')).toBe(
        true,
      );
      expect(history[0]!.fenBefore).toBe(INITIAL_FEN);
      expect(history[2]!.fenBefore).toBe(history[1]!.fenAfter);
    });

    it('desfazer restaura o estado anterior', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
      ]);

      const undone = engine.undo();

      expect(undone?.san).toBe('Nf3');
      expect(engine.turn()).toBe('w');
      expect(engine.fen()).toBe(
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      );
      expect(engine.history()).toHaveLength(2);

      engine.undo();
      engine.undo();

      expect(engine.fen()).toBe(INITIAL_FEN);
      expect(engine.turn()).toBe('w');
      expect(engine.history()).toHaveLength(0);
      expect(engine.undo()).toBeNull();
    });

    it('desfazer após xeque-mate restaura para lance anterior', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'd1', to: 'h5' },
        { from: 'b8', to: 'c6' },
        { from: 'f1', to: 'c4' },
        { from: 'g8', to: 'f6' },
        { from: 'h5', to: 'f7' },
      ]);

      expect(engine.isFinished()).toBe(true);
      const undone = engine.undo();

      expect(undone?.san).toBe('Qxf7#');
      expect(engine.isFinished()).toBe(false);
      expect(engine.turn()).toBe('w');
    });
  });

  describe('FEN e PGN', () => {
    it('exporta e carrega FEN preservando o estado', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' },
      ]);
      const fen = engine.fen();

      const loaded = ChessEngine.fromFen(fen);

      expect(loaded.fen()).toBe(fen);
      expect(loaded.turn()).toBe('w');
      expect(loaded.pieceAt('f3')).toEqual({ type: 'n', color: 'w' });
      expect(loaded.pieceAt('c6')).toEqual({ type: 'n', color: 'b' });
    });

    it('exporta PGN', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' },
      ]);

      const pgn = engine.pgn();

      expect(typeof pgn).toBe('string');
      expect(pgn).toContain('e4');
      expect(pgn).toContain('Nf3');
    });

    it('carrega PGN e reproduz o histórico', () => {
      const engine = ChessEngine.start();
      playMoves(engine, [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' },
      ]);
      const reference = engine.pgn();

      const loaded = ChessEngine.fromPgn(reference);

      expect(loaded.history()).toHaveLength(4);
      expect(loaded.fen()).toBe(engine.fen());
      expect(loaded.turn()).toBe('w');
    });

    it('PGN inválido lança erro de código invalid-pgn', () => {
      const engine = ChessEngine.start();

      expect(() => engine.loadPgn('1. e4 e5 2. Qh5# xpto')).toThrowError(
        expect.objectContaining({ code: 'invalid-pgn' }),
      );
      expect(engine.fen()).toBe(INITIAL_FEN);
      expect(engine.history()).toHaveLength(0);
    });
  });
});
