import { create } from 'zustand';

import { ChessEngine, type MoveInput, type MoveOutcome } from '@/domain/chess/engine';
import { resolveTimeout } from '@/domain/chess/status';
import type {
  ClaimableDrawReason,
  Color,
  GameResult,
  MoveRecord,
  Square,
  StatusReport,
} from '@/domain/chess/types';
import { ChessClock } from '@/domain/clock/clock';
import { DEFAULT_PRESET, type ClockPreset, type ClockSnapshot, type ClockSide } from '@/domain/clock/types';
import { clearGame, loadGame, saveGame, type PersistedGame } from '@/persistence/game';

export type GamePhase = 'waiting' | 'playing' | 'paused' | 'finished';

interface GameState {
  engine: ChessEngine;
  clock: ChessClock;
  phase: GamePhase;
  preset: ClockPreset;
  status: StatusReport;
  history: MoveRecord[];
  gameResult: GameResult | null;
  /** Snapshots do relógio capturados antes de cada `toggle()`, para desfazer. */
  clockSnapshots: ClockSnapshot[];

  startGame: (preset?: ClockPreset) => void;
  playMove: (input: MoveInput) => MoveOutcome;
  undoMove: () => MoveRecord | null;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  resign: () => void;
  claimDraw: (reason: ClaimableDrawReason) => void;
  save: () => void;
  load: () => boolean;
}

export const useGameStore = create<GameState>((set, get) => {
  const initialEngine = ChessEngine.start();
  const initialClock = new ChessClock(DEFAULT_PRESET);
  const initialStatus = initialEngine.status();
  const initialHistory = initialEngine.history();

  return {
    engine: initialEngine,
    clock: initialClock,
    phase: 'waiting',
    preset: DEFAULT_PRESET,
    status: initialStatus,
    history: initialHistory,
    gameResult: null,
    clockSnapshots: [],

    startGame: (nextPreset?: ClockPreset): void => {
      const p = nextPreset ?? DEFAULT_PRESET;
      const nextEngine = ChessEngine.start();
      const nextClock = new ChessClock(p);
      nextClock.start();
      const nextStatus = nextEngine.status();
      const nextHistory = nextEngine.history();

      set({
        engine: nextEngine,
        clock: nextClock,
        phase: 'playing',
        preset: p,
        status: nextStatus,
        history: nextHistory,
        gameResult: null,
        clockSnapshots: [],
      });
      get().save();
    },

    playMove: (input: MoveInput): MoveOutcome => {
      const { engine, clock, phase } = get();

      if (phase === 'finished' || phase === 'waiting') {
        return { ok: false, reason: 'game-over' };
      }

      const outcome = engine.play(input);

      if (!outcome.ok) {
        return outcome;
      }

      const snapshot = clock.snapshot();
      const clockSnapshots = get().clockSnapshots;
      const toggleResult = clock.toggle();

      const nextStatus = engine.status();
      const nextHistory = engine.history();

      const updates: Partial<GameState> = {
        clockSnapshots: [...clockSnapshots, snapshot],
        status: nextStatus,
        history: nextHistory,
      };

      if (engine.isFinished()) {
        updates.phase = 'finished';
        if (nextStatus.status.kind === 'finished') {
          const finishedResult = nextStatus.status.result;
          updates.gameResult = finishedResult;
        }
      } else if (toggleResult.justFlagged && toggleResult.flagged !== null) {
        const sideToColor: Record<ClockSide, Color> = { white: 'w', black: 'b' };
        const flagged = sideToColor[toggleResult.flagged];
        const insufficientMaterial = nextStatus.details.insufficientMaterial;
        const result = resolveTimeout(flagged, insufficientMaterial);

        updates.phase = 'finished';
        updates.gameResult = result;
        updates.status = {
          status: { kind: 'finished', result },
          claims: [],
          details: nextStatus.details,
        };
      }

      set(updates);
      get().save();
      return outcome;
    },

    undoMove: (): MoveRecord | null => {
      const { engine, phase, clockSnapshots } = get();

      if (phase === 'waiting' || clockSnapshots.length === 0) {
        return null;
      }

      const undone = engine.undo();

      if (undone === null) {
        return null;
      }

      const lastIndex = clockSnapshots.length - 1;
      const snapshot = clockSnapshots[lastIndex]!;

      set({
        clockSnapshots: clockSnapshots.slice(0, lastIndex),
      });
      get().clock.restoreFromSnapshot(snapshot);

      const nextStatus = engine.status();
      const nextHistory = engine.history();
      const nextPhase: GamePhase = engine.isFinished() ? 'finished' : 'playing';
      const nextResult: GameResult | null =
        nextStatus.status.kind === 'finished'
          ? nextStatus.status.result
          : null;

      set({
        status: nextStatus,
        history: nextHistory,
        phase: nextPhase,
        gameResult: nextResult,
      });
      get().save();
      return undone;
    },

    pause: (): void => {
      const { phase, clock } = get();

      if (phase !== 'playing') {
        return;
      }

      clock.pause();
      set({ phase: 'paused' });
      get().save();
    },

    resume: (): void => {
      const { phase, clock } = get();

      if (phase !== 'paused') {
        return;
      }

      clock.resume();
      set({ phase: 'playing' });
      get().save();
    },

    restart: (): void => {
      const { preset } = get();
      const nextEngine = ChessEngine.start();
      const nextClock = new ChessClock(preset);
      const nextStatus = nextEngine.status();
      const nextHistory = nextEngine.history();

      set({
        engine: nextEngine,
        clock: nextClock,
        phase: 'waiting',
        preset,
        status: nextStatus,
        history: nextHistory,
        gameResult: null,
        clockSnapshots: [],
      });
      clearGame();
    },

    resign: (): void => {
      const { engine } = get();
      const winner: Color = engine.turn() === 'w' ? 'b' : 'w';
      const result: GameResult = { kind: 'resignation', winner };

      set({ phase: 'finished', gameResult: result });
      get().save();
    },

    claimDraw: (reason: ClaimableDrawReason): void => {
      const { status } = get();

      if (!status.claims.includes(reason)) {
        return;
      }

      const result: GameResult = { kind: 'draw', reason };
      set({ phase: 'finished', gameResult: result });
      get().save();
    },

    save: (): void => {
      const { engine, clock, phase, preset } = get();

      const data: PersistedGame = {
        version: 1,
        preset,
        initialFen: engine.getInitialFen(),
        moves: engine.history(),
        clock: clock.snapshot(),
        phase,
        savedAt: Date.now(),
      };

      saveGame(data);
    },

    load: (): boolean => {
      const persisted = loadGame();

      if (!persisted) {
        return false;
      }

      const engine = ChessEngine.fromFen(persisted.initialFen);

      for (const move of persisted.moves) {
        engine.play({
          from: move.from as Square,
          to: move.to as Square,
          promotion: move.promotion,
        });
      }

      const clock = new ChessClock(persisted.preset);
      clock.restoreFromSnapshot({ ...persisted.clock, running: false });

      const nextStatus = engine.status();
      const nextHistory = engine.history();

      set({
        engine,
        clock,
        phase: 'paused',
        preset: persisted.preset,
        status: nextStatus,
        history: nextHistory,
        gameResult: null,
        clockSnapshots: [],
      });

      return true;
    },
  };
});

// Tenta restaurar a partida persistida ao criar a store.
// Em caso de falha, mantém a partida nova (waiting).
const persisted = loadGame();

if (persisted) {
  const engine = ChessEngine.fromFen(persisted.initialFen);

  for (const move of persisted.moves) {
    engine.play({
      from: move.from as Square,
      to: move.to as Square,
      promotion: move.promotion,
    });
  }

  const clock = new ChessClock(persisted.preset);
  clock.restoreFromSnapshot({ ...persisted.clock, running: false });

  const status = engine.status();
  const history = engine.history();

  useGameStore.setState({
    engine,
    clock,
    phase: 'paused',
    preset: persisted.preset,
    status,
    history,
    gameResult: null,
    clockSnapshots: [],
  });
}
