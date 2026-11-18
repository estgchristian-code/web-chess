import { describe, expect, it } from 'vitest';

import { colorLabel, formatMove, formatMoveLine, groupMoves } from './notation';
import type { MoveRecord } from './types';

function moveRecord(overrides: Partial<MoveRecord> = {}): MoveRecord {
  return {
    san: 'e4',
    from: 'e2',
    to: 'e4',
    color: 'w',
    piece: 'p',
    fenBefore: 'start',
    fenAfter: 'after',
    flags: {
      capture: false,
      enPassant: false,
      kingsideCastle: false,
      queensideCastle: false,
      promotion: false,
      bigPawn: false,
    },
    ...overrides,
  };
}

describe('notation', () => {
  it('colorLabel', () => {
    expect(colorLabel('w')).toBe('Brancas');
    expect(colorLabel('b')).toBe('Negras');
  });

  it('formatMoveNumber', () => {
    expect(formatMove(moveRecord(), 1)).toBe('1. e4');
    expect(formatMove(moveRecord({ color: 'b' }), 1)).toBe('1... e4');
  });

  it('formatMoveLine', () => {
    const moves = [
      moveRecord({ san: 'e4', color: 'w' }),
      moveRecord({ san: 'e5', color: 'b' }),
      moveRecord({ san: 'Nf3', color: 'w' }),
    ];

    expect(formatMoveLine(moves)).toBe('1. e4 e5 2. Nf3');
  });

  it('groupMoves emparelha brancas e pretas', () => {
    const moves = [
      moveRecord({ san: 'e4', color: 'w' }),
      moveRecord({ san: 'e5', color: 'b' }),
      moveRecord({ san: 'Nf3', color: 'w' }),
    ];

    const pairs = groupMoves(moves);

    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toEqual({
      number: 1,
      white: moves[0],
      black: moves[1],
    });
    expect(pairs[1]).toEqual({ number: 2, white: moves[2], black: null });
  });

  it('groupMoves com partida começando pelas pretas', () => {
    const moves = [
      moveRecord({ san: 'e5', color: 'b' }),
      moveRecord({ san: 'e4', color: 'w' }),
    ];

    const pairs = groupMoves(moves);

    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toEqual({ number: 1, white: null, black: moves[0] });
    expect(pairs[1]).toEqual({ number: 2, white: moves[1], black: null });
  });
});
