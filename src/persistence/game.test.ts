import { describe, expect, it, beforeEach } from 'vitest';

import { loadGame, saveGame, clearGame, type PersistedGame } from './game';

const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function makeClockSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    preset: '10+0' as const,
    whiteMs: 600000,
    blackMs: 600000,
    incrementMs: 0,
    activeSide: 'white' as const,
    running: false,
    flagged: null,
    finished: false,
    ...overrides,
  };
}

function makePersisted(overrides: Partial<PersistedGame> = {}): PersistedGame {
  return {
    version: 1,
    preset: '10+0',
    initialFen: INITIAL_FEN,
    moves: [],
    clock: makeClockSnapshot(),
    phase: 'waiting',
    savedAt: Date.now(),
    ...overrides,
  };
}

describe('persistence', () => {
  beforeEach(() => {
    clearGame();
  });

  it('salva e carrega um estado válido', () => {
    const data = makePersisted({
      moves: [
        {
          san: 'e4',
          from: 'e2',
          to: 'e4',
          color: 'w',
          piece: 'p',
          fenBefore: INITIAL_FEN,
          fenAfter:
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          flags: {
            capture: false,
            enPassant: false,
            kingsideCastle: false,
            queensideCastle: false,
            promotion: false,
            bigPawn: true,
          },
        },
      ],
      phase: 'playing',
    });

    saveGame(data);
    const loaded = loadGame();

    expect(loaded).toEqual(data);
  });

  it('retorna null quando o localStorage está vazio', () => {
    expect(loadGame()).toBeNull();
  });

  it('retorna null para JSON inválido', () => {
    localStorage.setItem('chess-game-v1', 'não é json');
    expect(loadGame()).toBeNull();
  });

  it('retorna null para versão incompatível', () => {
    const data = {
      ...makePersisted(),
      version: 99,
    } as unknown as PersistedGame;
    localStorage.setItem('chess-game-v1', JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('retorna null para campos obrigatórios ausentes', () => {
    const data = { ...makePersisted() };
    delete (data as Record<string, unknown>).preset;
    localStorage.setItem('chess-game-v1', JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('retorna null para preset inválido', () => {
    const data = {
      ...makePersisted(),
      preset: '99+99',
    } as unknown as PersistedGame;
    localStorage.setItem('chess-game-v1', JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('retorna null para phase inválida', () => {
    const data = {
      ...makePersisted(),
      phase: 'aberto',
    } as unknown as PersistedGame;
    localStorage.setItem('chess-game-v1', JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('clearGame remove o item armazenado', () => {
    const data = makePersisted();
    localStorage.setItem('chess-game-v1', JSON.stringify(data));
    expect(loadGame()).not.toBeNull();

    clearGame();
    expect(loadGame()).toBeNull();
  });

  it('saveGame não lança exceção com dados válidos', () => {
    expect(() => saveGame(makePersisted())).not.toThrow();
    expect(loadGame()).not.toBeNull();
  });
});
