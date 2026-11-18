import type { Color, MovePair, MoveRecord } from './types';

/**
 * Notação e apresentação dos lances.
 *
 * O SAN nunca é construído aqui: ele vem pronto do chess.js (`Move.san`), o que
 * garante desambiguação, símbolos de xeque/mate e sufixos de promoção corretos.
 * Este módulo apenas organiza esses lances para exibição.
 */

const COLOR_LABELS: Record<Color, string> = {
  w: 'Brancas',
  b: 'Negras',
};

export function colorLabel(color: Color): string {
  return COLOR_LABELS[color];
}

/** `1.` para as brancas, `1...` para as negras. */
export function formatMoveNumber(moveNumber: number, color: Color): string {
  return color === 'w' ? `${moveNumber}.` : `${moveNumber}...`;
}

export function formatMove(move: MoveRecord, moveNumber: number): string {
  return `${formatMoveNumber(moveNumber, move.color)} ${move.san}`;
}

/**
 * Agrupa os lances em pares brancas/negras.
 *
 * Lida com partidas iniciadas fora da posição inicial: se o primeiro lance for
 * das negras, o primeiro par fica com `white: null`. Um par sem o lance das
 * negras (partida encerrada após o lance branco) permanece aberto.
 */
export function groupMoves(moves: readonly MoveRecord[], startingMoveNumber = 1): MovePair[] {
  const pairs: MovePair[] = [];
  let number = startingMoveNumber;
  let openPair: MovePair | null = null;

  for (const move of moves) {
    if (move.color === 'w') {
      openPair = { number, white: move, black: null };
      pairs.push(openPair);
      continue;
    }

    if (openPair !== null && openPair.black === null) {
      openPair.black = move;
      openPair = null;
      number += 1;
      continue;
    }

    pairs.push({ number, white: null, black: move });
    number += 1;
  }

  return pairs;
}

/**
 * Linha de lances pronta para exibição ou depuração:
 * `1. e4 e5 2. Nf3 Nc6`.
 */
export function formatMoveLine(moves: readonly MoveRecord[], startingMoveNumber = 1): string {
  return groupMoves(moves, startingMoveNumber)
    .map((pair) => {
      const parts: string[] = [];

      if (pair.white !== null) {
        parts.push(`${formatMoveNumber(pair.number, 'w')} ${pair.white.san}`);
      }

      if (pair.black !== null) {
        parts.push(
          pair.white === null
            ? `${formatMoveNumber(pair.number, 'b')} ${pair.black.san}`
            : pair.black.san,
        );
      }

      return parts.join(' ');
    })
    .join(' ');
}
