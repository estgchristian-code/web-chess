import type {
  ClaimableDrawReason,
  Color,
  DrawReason,
  GameResult,
  StatusReport,
} from './types';

type AutomaticDrawReason = Extract<
  DrawReason,
  'stalemate' | 'insufficient-material' | 'fivefold-repetition' | 'seventy-five-move-rule'
>;

/**
 * Dados necessários para decidir o estado da partida. É uma estrutura plana e
 * pura para que a decisão seja testável sem instanciar um tabuleiro.
 */
export type StatusInput = {
  /** Cor de quem deve jogar. */
  turn: Color;
  inCheck: boolean;
  checkmate: boolean;
  stalemate: boolean;
  insufficientMaterial: boolean;
  /** Quantas vezes a posição atual já ocorreu na partida, incluindo agora. */
  repetitionCount: number;
  /** Meio-lances desde a última captura ou movimento de peão (campo 5 do FEN). */
  halfmoveClock: number;
};

/** FIDE 9.2: três ocorrências da mesma posição. */
export const THREEFOLD_REPETITION = 3;
/** FIDE 9.6: cinco ocorrências encerram a partida automaticamente. */
export const FIVEFOLD_REPETITION = 5;
/** FIDE 9.3: 50 lances de cada lado = 100 meios-lances. */
export const FIFTY_MOVE_HALFMOVES = 100;
/** FIDE 9.7: 75 lances de cada lado = 150 meios-lances, automático. */
export const SEVENTY_FIVE_MOVE_HALFMOVES = 150;

export function opponent(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

/**
 * Avalia o estado da partida.
 *
 * Precedência (FIDE 5.1.1 e 9.6.2): xeque-mate encerra imediatamente, mesmo que
 * o lance também complete a regra dos 75 lances. Material insuficiente só é
 * considerado quando não há xeque-mate — uma posição de mate prova que o mate
 * é possível.
 */
export function evaluateStatus(input: StatusInput): StatusReport {
  const details = {
    inCheck: input.inCheck,
    insufficientMaterial: input.insufficientMaterial,
    repetitionCount: input.repetitionCount,
    halfmoveClock: input.halfmoveClock,
  };

  if (input.checkmate) {
    return {
      status: {
        kind: 'finished',
        result: { kind: 'checkmate', winner: opponent(input.turn) },
      },
      claims: [],
      details,
    };
  }

  const automaticDraw = resolveAutomaticDraw(input);

  if (automaticDraw) {
    return {
      status: { kind: 'finished', result: { kind: 'draw', reason: automaticDraw } },
      claims: [],
      details,
    };
  }

  return {
    status: { kind: 'playing', check: input.inCheck },
    claims: resolveClaims(input),
    details,
  };
}

function resolveAutomaticDraw(input: StatusInput): AutomaticDrawReason | null {
  if (input.stalemate) {
    return 'stalemate';
  }

  if (input.insufficientMaterial) {
    return 'insufficient-material';
  }

  if (input.repetitionCount >= FIVEFOLD_REPETITION) {
    return 'fivefold-repetition';
  }

  if (input.halfmoveClock >= SEVENTY_FIVE_MOVE_HALFMOVES) {
    return 'seventy-five-move-rule';
  }

  return null;
}

function resolveClaims(input: StatusInput): ClaimableDrawReason[] {
  const claims: ClaimableDrawReason[] = [];

  if (input.repetitionCount >= THREEFOLD_REPETITION) {
    claims.push('threefold-repetition');
  }

  if (input.halfmoveClock >= FIFTY_MOVE_HALFMOVES) {
    claims.push('fifty-move-rule');
  }

  return claims;
}

/**
 * Resultado do estouro de tempo.
 *
 * FIDE 6.9: quem estoura perde, exceto se o adversário não tiver material
 * suficiente para dar mate — nesse caso a partida é empate.
 */
export function resolveTimeout(flagged: Color, insufficientMaterial: boolean): GameResult {
  if (insufficientMaterial) {
    return { kind: 'draw', reason: 'insufficient-material' };
  }

  return { kind: 'timeout', winner: opponent(flagged) };
}
