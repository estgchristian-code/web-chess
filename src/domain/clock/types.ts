/**
 * Presets de tempo de partida e tipos do relógio.
 *
 * O relógio é puramente baseado em timestamps: nunca decrementa por
 * intervalos, apenas subtrai o tempo decorrido entre dois instantes
 * (`now`). Nunca permite tempo negativo.
 */

export type ClockPreset = 'unlimited' | '5+0' | '10+0' | '15+10';

export interface ClockPresetDef {
  /** `number` minutos, ou 'infinite' para sem limite. */
  baseMinutes: number | 'infinite';
  incrementSeconds: number;
}

export const CLOCK_PRESETS: Record<ClockPreset, ClockPresetDef> = {
  unlimited: { baseMinutes: 'infinite', incrementSeconds: 0 },
  '5+0': { baseMinutes: 5, incrementSeconds: 0 },
  '10+0': { baseMinutes: 10, incrementSeconds: 0 },
  '15+10': { baseMinutes: 15, incrementSeconds: 10 },
};

/** Preset usado quando nenhum é informado. */
export const DEFAULT_PRESET: ClockPreset = '10+0';

export type ClockSide = 'white' | 'black';

export type ClockSnapshot = {
  preset: ClockPreset;
  whiteMs: number;
  blackMs: number;
  incrementMs: number;
  activeSide: ClockSide | null;
  running: boolean;
  flagged: ClockSide | null;
  finished: boolean;
};

export type ClockToggleResult = {
  /** Lado cujo tempo acabou ao consumir o lance (null se nenhum). */
  flagged: ClockSide | null;
  justFlagged: boolean;
};

export function opponentSide(side: ClockSide): ClockSide {
  return side === 'white' ? 'black' : 'white';
}
