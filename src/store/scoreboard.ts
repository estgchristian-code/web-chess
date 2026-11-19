import { create } from 'zustand';

import type { GameResult } from '@/domain/chess/types';
import {
  addResult,
  loadScoreboard,
  saveScoreboard,
  SCOREBOARD_STORAGE_VERSION,
  type PersistedScoreboard,
  type ScoreboardCounts,
} from '@/persistence/scoreboard';
import { useGameStore } from '@/store/game';

type ScoreboardState = ScoreboardCounts & {
  currentMatchId: string;
  lastRecordedMatchId: string | null;
  beginMatch: () => void;
  recordResult: (result: GameResult) => void;
};

function createMatchId(): string {
  return `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const persisted = loadScoreboard();

export const useScoreboardStore = create<ScoreboardState>((set, get) => ({
  whiteWins: persisted?.whiteWins ?? 0,
  blackWins: persisted?.blackWins ?? 0,
  draws: persisted?.draws ?? 0,
  total: (persisted?.whiteWins ?? 0) + (persisted?.blackWins ?? 0) + (persisted?.draws ?? 0),
  currentMatchId: persisted?.currentMatchId ?? createMatchId(),
  lastRecordedMatchId: persisted?.lastRecordedMatchId ?? null,

  beginMatch: (): void => {
    set({ currentMatchId: createMatchId() });
    persist(get());
  },

  recordResult: (result: GameResult): void => {
    const state = get();

    // Cada partida só pode ser contabilizada uma única vez, mesmo que a store
    // emita o estado final novamente (ex.: desistir após desfazer um resultado).
    if (state.currentMatchId === state.lastRecordedMatchId) {
      return;
    }

    const counts = addResult(state, result);

    set({
      ...counts,
      lastRecordedMatchId: state.currentMatchId,
    });
    persist(get());
  },
}));

function persist(state: ScoreboardState): void {
  const data: PersistedScoreboard = {
    version: SCOREBOARD_STORAGE_VERSION,
    whiteWins: state.whiteWins,
    blackWins: state.blackWins,
    draws: state.draws,
    currentMatchId: state.currentMatchId,
    lastRecordedMatchId: state.lastRecordedMatchId,
  };

  saveScoreboard(data);
}

// Persiste o identificador da partida atual desde o início, para que um reload
// não faça a mesma partida ser contabilizada novamente.
persist(useScoreboardStore.getState());

let observedEngine = useGameStore.getState().engine;

useGameStore.subscribe((state) => {
  if (state.engine !== observedEngine) {
    observedEngine = state.engine;
    useScoreboardStore.getState().beginMatch();
  }

  if (state.phase === 'finished' && state.gameResult) {
    useScoreboardStore.getState().recordResult(state.gameResult);
  }
});
