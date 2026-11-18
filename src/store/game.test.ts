import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { useGameStore } from './game';
import { loadGame } from '@/persistence/game';
import type { Square } from '@/domain/chess/types';

function getStore() {
  return useGameStore.getState();
}

function resetStore() {
  getStore().restart();
  localStorage.clear();
}

beforeEach(() => {
  resetStore();
  vi.useRealTimers();
});

afterEach(() => {
  resetStore();
  vi.useRealTimers();
});

describe('useGameStore - estado inicial', () => {
  it('começa na fase waiting com tabuleiro inicial', () => {
    const { phase, engine, history, gameResult, preset } = getStore();

    expect(phase).toBe('waiting');
    expect(engine.fen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(history).toHaveLength(0);
    expect(gameResult).toBeNull();
    expect(preset).toBe('10+0');
  });

  it('relógio não está rodando inicialmente', () => {
    const { clock } = getStore();

    expect(clock.isRunning()).toBe(false);
    expect(clock.getActiveSide()).toBeNull();
  });
});

describe('startGame', () => {
  it('inicia a partida com o preset 10+0 por padrão', () => {
    const store = getStore();

    store.startGame();

    const { phase, engine, clock, preset, status } = getStore();

    expect(phase).toBe('playing');
    expect(preset).toBe('10+0');
    expect(clock.isRunning()).toBe(true);
    expect(clock.getActiveSide()).toBe('white');
    expect(engine.fen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(status.status.kind).toBe('playing');
  });

  it('inicia com o preset informado', () => {
    const now = 1_000_000_000_000;
    vi.setSystemTime(new Date(now));
    getStore().startGame('15+10');

    const { preset, clock } = getStore();

    expect(preset).toBe('15+10');
    expect(clock.getIncrementSeconds()).toBe(10);
    expect(clock.remaining('white')).toBe(15 * 60_000);

    vi.useRealTimers();
  });

  it('salva automaticamente ao iniciar', () => {
    getStore().startGame();

    expect(loadGame()).not.toBeNull();
  });
});

describe('playMove', () => {
  beforeEach(() => {
    getStore().startGame();
  });

  it('executa um lance legal e alterna o turno', () => {
    const store = getStore();
    const outcome = store.playMove({ from: 'e2', to: 'e4' });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.move.san).toBe('e4');
      expect(outcome.move.from).toBe('e2');
      expect(outcome.move.to).toBe('e4');
    }

    const { engine, history, phase, clock } = getStore();

    expect(engine.turn()).toBe('b');
    expect(history).toHaveLength(1);
    expect(history[0]!.san).toBe('e4');
    expect(phase).toBe('playing');
    expect(clock.getActiveSide()).toBe('black');
    expect(clock.remaining('white')).toBeLessThan(10 * 60_000);
  });

  it('aplica incremento quando configurado', () => {
    getStore().restart();
    getStore().startGame('15+10');

    const before = getStore().clock.remaining('white');
    getStore().playMove({ from: 'e2', to: 'e4' });
    const after = getStore().clock.remaining('white');

    expect(after).toBeGreaterThan(before - 60_000);
    expect(after).toBeLessThanOrEqual(15 * 60_000 + 10_000);
  });

  it('rejeita lance ilegal sem alterar o estado', () => {
    const store = getStore();
    const outcome = store.playMove({ from: 'e7', to: 'e5' });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('illegal-move');
    }

    const { engine, history } = getStore();
    expect(history).toHaveLength(0);
    expect(engine.turn()).toBe('w');
    expect(engine.fen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
  });

  it('rejeita lance quando a partida já terminou', () => {
    const store = getStore();
    store.playMove({ from: 'f2', to: 'f3' });
    store.playMove({ from: 'e7', to: 'e5' });
    store.playMove({ from: 'g2', to: 'g4' });
    store.playMove({ from: 'd8', to: 'h4' }); // tolo mate

    const { phase } = getStore();
    expect(phase).toBe('finished');

    const rejected = store.playMove({ from: 'e8', to: 'd7' });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.reason).toBe('game-over');
    }
  });

  it('salva automaticamente após cada lance', () => {
    getStore().playMove({ from: 'e2', to: 'e4' });

    expect(loadGame()).not.toBeNull();
  });
});

describe('undoMove', () => {
  beforeEach(() => {
    getStore().startGame();
  });

  it('desfaz o último lance, restaurando tabuleiro e histórico', () => {
    getStore().playMove({ from: 'e2', to: 'e4' });
    getStore().playMove({ from: 'e7', to: 'e5' });
    getStore().playMove({ from: 'g1', to: 'f3' });

    const store = getStore();
    const undone = store.undoMove();

    expect(undone?.san).toBe('Nf3');
    expect(getStore().history).toHaveLength(2);
    expect(getStore().engine.turn()).toBe('w');
    expect(getStore().phase).toBe('playing');
  });

  it('desfaz múltiplos lances em sequência', () => {
    getStore().playMove({ from: 'e2', to: 'e4' });
    getStore().playMove({ from: 'e7', to: 'e5' });

    getStore().undoMove();
    getStore().undoMove();

    const { engine, history } = getStore();
    expect(history).toHaveLength(0);
    expect(engine.fen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(engine.turn()).toBe('w');
  });

  it('restaura o relógio ao desfazer', () => {
    const startTime = 1_000_000_000_000;
    vi.setSystemTime(new Date(startTime));
    getStore().startGame();

    vi.setSystemTime(new Date(startTime + 5_000));
    const whiteBefore = getStore().clock.remaining('white');

    getStore().playMove({ from: 'e2', to: 'e4' });
    const whiteAfterMove = getStore().clock.remaining('white');

    expect(whiteAfterMove).toBeLessThanOrEqual(whiteBefore);

    getStore().undoMove();
    const whiteAfterUndo = getStore().clock.remaining('white');

    expect(whiteAfterUndo).toBe(whiteBefore);
    expect(getStore().clock.getActiveSide()).toBe('white');

    vi.useRealTimers();
  });

  it('retorna null quando não há o que desfazer', () => {
    const store = getStore();
    const result = store.undoMove();

    expect(result).toBeNull();
  });
});

describe('pause / resume', () => {
  beforeEach(() => {
    getStore().startGame();
  });

  it('pausa o relógio e muda para paused', () => {
    const store = getStore();
    store.pause();

    const { phase, clock } = getStore();
    expect(phase).toBe('paused');
    expect(clock.isRunning()).toBe(false);
  });

  it('pausa quando já está pausado não altera nada', () => {
    getStore().pause();
    const whiteBefore = getStore().clock.remaining('white');

    getStore().pause();

    const { phase, clock } = getStore();
    expect(phase).toBe('paused');
    expect(clock.remaining('white')).toBe(whiteBefore);
    expect(clock.isRunning()).toBe(false);
  });

  it('retorna da pausa e o relógio volta a rodar', () => {
    getStore().pause();
    getStore().resume();

    const { phase, clock } = getStore();
    expect(phase).toBe('playing');
    expect(clock.isRunning()).toBe(true);
    expect(clock.getActiveSide()).toBe('white');
  });

  it('resume quando não está pausado não altera nada', () => {
    getStore().resume();

    const { phase, clock } = getStore();
    expect(phase).toBe('playing');
    expect(clock.isRunning()).toBe(true);
  });
});

describe('restart', () => {
  it('volta para waiting com um tabuleiro novo', () => {
    getStore().startGame();
    getStore().playMove({ from: 'e2', to: 'e4' });
    getStore().pause();

    getStore().restart();

    const { phase, engine, history, clock, gameResult } = getStore();
    expect(phase).toBe('waiting');
    expect(engine.fen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(history).toHaveLength(0);
    expect(clock.isRunning()).toBe(false);
    expect(clock.getActiveSide()).toBeNull();
    expect(gameResult).toBeNull();
    expect(loadGame()).toBeNull();
  });
});

describe('resign', () => {
  it('encerra a partida com vitória do adversário por resignação', () => {
    getStore().startGame();
    getStore().playMove({ from: 'e2', to: 'e4' }); // branco jogou, agora é a vez das pretas

    getStore().resign();

    const { phase, gameResult } = getStore();
    expect(phase).toBe('finished');
    expect(gameResult).toEqual({ kind: 'resignation', winner: 'w' });
  });
});

describe('claimDraw', () => {
  it('encerra com empate quando o empate é reivindicável', () => {
    getStore().startGame();

    // Repetição tripla: Nf3 Nf6 Ng1 Ng8 x3
    const moves: { from: Square; to: Square }[] = [
      { from: 'g1', to: 'f3' },
      { from: 'g8', to: 'f6' },
      { from: 'f3', to: 'g1' },
      { from: 'f6', to: 'g8' },
      { from: 'g1', to: 'f3' },
      { from: 'g8', to: 'f6' },
      { from: 'f3', to: 'g1' },
      { from: 'f6', to: 'g8' },
      { from: 'g1', to: 'f3' },
      { from: 'g8', to: 'f6' },
      { from: 'f3', to: 'g1' },
      { from: 'f6', to: 'g8' },
    ];

    for (const m of moves) {
      getStore().playMove(m);
    }

    const { status } = getStore();
    expect(status.claims).toContain('threefold-repetition');

    getStore().claimDraw('threefold-repetition');

    const { phase, gameResult } = getStore();
    expect(phase).toBe('finished');
    expect(gameResult).toEqual({ kind: 'draw', reason: 'threefold-repetition' });
  });

  it('não encerra quando o empate não é reivindicável', () => {
    getStore().startGame();

    getStore().claimDraw('threefold-repetition');

    const { phase } = getStore();
    expect(phase).toBe('playing');
  });
});

describe('timeout pelo relógio', () => {
  it('encera por timeout quando o tempo do lado acaba', () => {
    const start = 1_000_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(start);

    getStore().startGame('5+0'); // 5 minutos = 300_000 ms

    nowSpy.mockReturnValue(start + 300_001); // 5 minutos + 1 ms

    getStore().playMove({ from: 'e2', to: 'e4' });

    const { phase, gameResult, clock } = getStore();
    expect(phase).toBe('finished');
    expect(clock.isFlagged('white')).toBe(true);
    expect(gameResult).toEqual({ kind: 'timeout', winner: 'b' });

    nowSpy.mockRestore();
  });
});

describe('persistência integrada à store', () => {
  it('salva e restaura a partida', () => {
    getStore().startGame();
    getStore().playMove({ from: 'e2', to: 'e4' });

    const saved = loadGame();
    expect(saved).not.toBeNull();
    expect(saved!.moves).toHaveLength(1);
    expect(saved!.phase).toBe('playing');

    const restored = getStore().load();

    expect(restored).toBe(true);
    const { phase, engine, history, clock } = getStore();
    expect(phase).toBe('paused'); // restaurado sempre em pausa
    expect(engine.fen()).not.toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    ); // posição após e4
    expect(history).toHaveLength(1);
    expect(history[0]!.san).toBe('e4');
    expect(clock.isRunning()).toBe(false);
  });

  it('load retorna false quando não há dado persistido', () => {
    resetStore();
    expect(getStore().load()).toBe(false);
  });

  it('load não quebra com dados inválidos no storage', () => {
    localStorage.setItem('chess-game-v1', 'abc123!!!');
    resetStore();
    expect(getStore().load()).toBe(false);
    expect(getStore().phase).toBe('waiting');
  });
});
