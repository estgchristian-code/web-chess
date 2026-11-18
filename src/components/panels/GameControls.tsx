import { Button } from '@/components/ui/Button';
import { IconPause, IconPlay, IconRotateCcw, IconX, IconFlag, IconRefreshCw } from '@/components/ui/icons';
import type { ClockPreset } from '@/domain/clock/types';
import type { GamePhase } from '@/store/game';

type GameControlsProps = {
  phase: GamePhase;
  preset: ClockPreset;
  onStart: (preset?: ClockPreset) => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onResign: () => void;
  onDraw: () => void;
  onNewGame: () => void;
  presetOptions?: ClockPreset[];
  onPresetChange?: (preset: ClockPreset) => void;
};

export function GameControls({
  phase,
  preset,
  onStart,
  onPause,
  onResume,
  onRestart,
  onResign,
  onDraw,
  onNewGame,
  presetOptions = ['5+0', '10+0', '15+10'],
  onPresetChange,
}: GameControlsProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[480px]">
      {/* Preset selector (only when waiting) */}
      {phase === 'waiting' && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-ink-muted font-medium">Tempo:</label>
          <select
            value={preset}
            onChange={(e) => onPresetChange?.(e.target.value as ClockPreset)}
            className="flex-1 min-w-[140px] px-2.5 py-1.5 text-sm bg-surface border border-line-strong rounded-control text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none bg-no-repeat bg-right pr-8"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            {presetOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Primary action buttons */}
      <div className="flex flex-wrap gap-2">
        {phase === 'waiting' && (
          <Button size="lg" onClick={() => onStart(preset)} className="w-full sm:w-auto">
            Nova partida
          </Button>
        )}

        {phase === 'playing' && (
          <>
            <Button variant="secondary" size="md" onClick={onPause}>
              <IconPause className="size-4" />
              <span className="hidden sm:inline">Pausar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onDraw}>
              <IconFlag className="size-4" />
              <span className="hidden sm:inline">Empatar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onResign}>
              <IconX className="size-4" />
              <span className="hidden sm:inline">Desistir</span>
            </Button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <Button size="md" onClick={onResume}>
              <IconPlay className="size-4" />
              <span className="hidden sm:inline">Retomar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onDraw}>
              <IconFlag className="size-4" />
              <span className="hidden sm:inline">Empatar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onResign}>
              <IconX className="size-4" />
              <span className="hidden sm:inline">Desistir</span>
            </Button>
          </>
        )}

        {phase === 'finished' && (
          <Button variant="secondary" size="md" onClick={onRestart}>
            <IconRotateCcw className="size-4" />
            <span className="hidden sm:inline">Reiniciar</span>
          </Button>
        )}

        {/* Always show new game button */}
        <Button variant="ghost" size="md" onClick={onNewGame}>
          <IconRefreshCw className="size-4" />
          <span className="hidden sm:inline">Nova partida</span>
        </Button>
      </div>
    </div>
  );
}