import type { GameResult } from '@/domain/chess/types';

export const SCOREBOARD_STORAGE_VERSION = 1;

/** Chave independente da partida (`chess-game-v1`) e da aparência (`chess-appearance-v1`). */
export const SCOREBOARD_STORAGE_KEY = 'chess-scoreboard-v1';

export type ScoreboardCounts = {
  whiteWins: number;
  blackWins: number;
  draws: number;
  total: number;
};

export type PersistedScoreboard = {
  version: typeof SCOREBOARD_STORAGE_VERSION;
  whiteWins: number;
  blackWins: number;
  draws: number;
  /** Identifica a partida em andamento para não contar o mesmo resultado duas vezes. */
  currentMatchId: string | null;
  lastRecordedMatchId: string | null;
};

export const EMPTY_SCOREBOARD: ScoreboardCounts = {
  whiteWins: 0,
  blackWins: 0,
  draws: 0,
  total: 0,
};

/** Aplica um resultado concluído ao placar, mantendo o total derivado. */
export function addResult(counts: ScoreboardCounts, result: GameResult): ScoreboardCounts {
  const next = { ...counts };

  if (result.kind === 'draw') {
    next.draws += 1;
  } else if (result.winner === 'w') {
    next.whiteWins += 1;
  } else {
    next.blackWins += 1;
  }

  next.total = next.whiteWins + next.blackWins + next.draws;
  return next;
}

/** Grava o placar. Erros de armazenamento são ignorados silenciosamente. */
export function saveScoreboard(data: PersistedScoreboard): void {
  try {
    localStorage.setItem(SCOREBOARD_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota excedida, modo privado, etc.: o placar em memória continua válido.
  }
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Lê e valida o placar persistido. Retorna null quando não há dado, o conteúdo
 * é inválido ou ocorre qualquer erro de leitura.
 */
export function loadScoreboard(): PersistedScoreboard | null {
  try {
    const raw = localStorage.getItem(SCOREBOARD_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (candidate.version !== SCOREBOARD_STORAGE_VERSION) {
      return null;
    }

    if (
      !isCount(candidate.whiteWins) ||
      !isCount(candidate.blackWins) ||
      !isCount(candidate.draws)
    ) {
      return null;
    }

    const currentMatchId = candidate.currentMatchId;
    const lastRecordedMatchId = candidate.lastRecordedMatchId;

    if (currentMatchId !== null && typeof currentMatchId !== 'string') {
      return null;
    }

    if (lastRecordedMatchId !== null && typeof lastRecordedMatchId !== 'string') {
      return null;
    }

    return {
      version: SCOREBOARD_STORAGE_VERSION,
      whiteWins: candidate.whiteWins,
      blackWins: candidate.blackWins,
      draws: candidate.draws,
      currentMatchId,
      lastRecordedMatchId,
    };
  } catch {
    return null;
  }
}
