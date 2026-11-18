import { Chess, validateFen, type Move } from 'chess.js';

import { evaluateStatus } from './status';
import type {
  Color,
  MoveRecord,
  Piece,
  PromotionPiece,
  Square,
  StatusReport,
} from './types';

export type MoveInput = {
  from: Square;
  to: Square;
  /** Obrigatório quando o lance é uma promoção. */
  promotion?: PromotionPiece;
};

export type MoveRejectionReason = 'illegal-move' | 'game-over';

export type MoveOutcome =
  | { ok: true; move: MoveRecord }
  | { ok: false; reason: MoveRejectionReason };

export type ChessEngineErrorCode = 'invalid-fen' | 'invalid-pgn';

export class ChessEngineError extends Error {
  readonly code: ChessEngineErrorCode;

  constructor(code: ChessEngineErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ChessEngineError';
    this.code = code;
  }
}

const PROMOTION_PIECES: readonly PromotionPiece[] = ['q', 'r', 'b', 'n'];

/**
 * Fachada tipada sobre o chess.js.
 *
 * É a única camada autorizada a importar a biblioteca. Toda a validade dos
 * lances vem do chess.js; aqui só há tradução de tipos, contagem de repetições
 * (via `hash()` público) e composição com `status.ts`.
 */
export class ChessEngine {
  private readonly chess: Chess;
  private counts: Map<string, number>;
  private startFen: string;
  private startFullMoveNumber: number;

  private constructor(chess: Chess) {
    this.chess = chess;
    this.counts = new Map();
    this.startFen = chess.fen();
    this.startFullMoveNumber = 1;
    this.refreshMetadata();
  }

  static start(): ChessEngine {
    return new ChessEngine(new Chess());
  }

  static fromFen(fen: string): ChessEngine {
    const engine = new ChessEngine(new Chess());
    engine.loadFen(fen);
    return engine;
  }

  static fromPgn(pgn: string): ChessEngine {
    const engine = new ChessEngine(new Chess());
    engine.loadPgn(pgn);
    return engine;
  }

  getInitialFen(): string {
    return this.startFen;
  }

  getInitialFullMoveNumber(): number {
    return this.startFullMoveNumber;
  }

  fen(): string {
    return this.chess.fen();
  }

  turn(): Color {
    return this.chess.turn();
  }

  pieceAt(square: Square): Piece | null {
    const piece = this.chess.get(square);
    return piece ? { type: piece.type, color: piece.color } : null;
  }

  legalMoves(square?: Square): MoveRecord[] {
    const moves = square
      ? this.chess.moves({ square, verbose: true })
      : this.chess.moves({ verbose: true });
    return moves.map(toMoveRecord);
  }

  history(): MoveRecord[] {
    return this.chess.history({ verbose: true }).map(toMoveRecord);
  }

  halfmoveClock(): number {
    return parseFenCounter(this.chess.fen().split(' ')[4]);
  }

  /** Ocorrências da posição atual na partida, incluindo a atual. */
  repetitionCount(): number {
    return this.counts.get(this.chess.hash()) ?? 1;
  }

  status(): StatusReport {
    return evaluateStatus({
      turn: this.chess.turn(),
      inCheck: this.chess.isCheck(),
      checkmate: this.chess.isCheckmate(),
      stalemate: this.chess.isStalemate(),
      insufficientMaterial: this.chess.isInsufficientMaterial(),
      repetitionCount: this.repetitionCount(),
      halfmoveClock: this.halfmoveClock(),
    });
  }

  isFinished(): boolean {
    return this.status().status.kind === 'finished';
  }

  /**
   * Executa um lance. Lances ilegais (incluindo promoção sem peça escolhida)
   * são rejeitados sem alterar o estado.
   */
  play(input: MoveInput): MoveOutcome {
    if (this.isFinished()) {
      return { ok: false, reason: 'game-over' };
    }

    if (!this.hasLegalMove(input)) {
      return { ok: false, reason: 'illegal-move' };
    }

    let applied: Move;

    try {
      applied = this.chess.move({
        from: input.from,
        to: input.to,
        promotion: input.promotion,
      });
    } catch {
      return { ok: false, reason: 'illegal-move' };
    }

    this.registerPosition(this.chess.hash());

    return { ok: true, move: toMoveRecord(applied) };
  }

  undo(): MoveRecord | null {
    const hashBeforeUndo = this.chess.hash();
    const undone = this.chess.undo();

    if (undone === null) {
      return null;
    }

    this.unregisterPosition(hashBeforeUndo);

    return toMoveRecord(undone);
  }

  pgn(): string {
    return this.chess.pgn();
  }

  reset(): void {
    this.chess.reset();
    this.refreshMetadata();
  }

  loadFen(fen: string): void {
    const validation = validateFen(fen);

    if (!validation.ok) {
      throw new ChessEngineError('invalid-fen', validation.error ?? 'FEN inválida.');
    }

    this.chess.load(fen);
    this.refreshMetadata();
  }

  loadPgn(pgn: string): void {
    try {
      this.chess.loadPgn(pgn);
    } catch (cause) {
      this.chess.reset();
      this.refreshMetadata();
      throw new ChessEngineError('invalid-pgn', 'PGN inválido ou com lances ilegais.', {
        cause,
      });
    }

    this.refreshMetadata();
  }

  private hasLegalMove(input: MoveInput): boolean {
    return this.chess
      .moves({ square: input.from, verbose: true })
      .some(
        (move) => move.to === input.to && toPromotionPiece(move.promotion) === input.promotion,
      );
  }

  private registerPosition(hash: string): void {
    this.counts.set(hash, (this.counts.get(hash) ?? 0) + 1);
  }

  private unregisterPosition(hash: string): void {
    const count = this.counts.get(hash) ?? 0;

    if (count <= 1) {
      this.counts.delete(hash);
      return;
    }

    this.counts.set(hash, count - 1);
  }

  private refreshMetadata(): void {
    const moves = this.chess.history({ verbose: true });

    this.startFen = moves[0]?.before ?? this.chess.fen();
    this.startFullMoveNumber = parseFenCounter(this.startFen.split(' ')[5]);
    this.counts = buildPositionCounts(this.startFen, moves);
  }
}

function toPromotionPiece(value: string | undefined): PromotionPiece | undefined {
  return PROMOTION_PIECES.find((piece) => piece === value);
}

function toMoveRecord(move: Move): MoveRecord {
  const promotion = toPromotionPiece(move.promotion);

  return {
    san: move.san,
    from: move.from,
    to: move.to,
    color: move.color,
    piece: move.piece,
    ...(move.captured === undefined ? {} : { captured: move.captured }),
    ...(promotion === undefined ? {} : { promotion }),
    fenBefore: move.before,
    fenAfter: move.after,
    flags: {
      capture: move.isCapture(),
      enPassant: move.isEnPassant(),
      kingsideCastle: move.isKingsideCastle(),
      queensideCastle: move.isQueensideCastle(),
      promotion: move.isPromotion(),
      bigPawn: move.isBigPawn(),
    },
  };
}

function parseFenCounter(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Reconstrói a contagem de posições (para repetição) a partir do histórico.
 *
 * Usa apenas API pública do chess.js: o `hash()` identifica a posição como a
 * própria biblioteca a entende (peças, turno, roque e en passant). Necessário
 * após importar PGN ou carregar um FEN, quando não houve `play()`.
 */
function buildPositionCounts(startFen: string, moves: readonly Move[]): Map<string, number> {
  const counts = new Map<string, number>();
  const board = new Chess(startFen);

  counts.set(board.hash(), 1);

  for (const move of moves) {
    board.move({ from: move.from, to: move.to, promotion: move.promotion });

    const hash = board.hash();
    counts.set(hash, (counts.get(hash) ?? 0) + 1);
  }

  return counts;
}
