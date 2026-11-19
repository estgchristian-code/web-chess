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
        <div className="flex items-center gap-2.5">
          <label className="text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Tempo:
          </label>
          <select
            value={preset}
            onChange={(e) => onPresetChange?.(e.target.value as ClockPreset)}
            className="h-10 min-w-[140px] flex-1 cursor-pointer appearance-none rounded-control border border-line/80 bg-surface bg-no-repeat px-3 pr-9 text-sm text-ink-soft transition-colors hover:border-line-strong hover:bg-surface-muted/40 focus:border-accent/50 focus:ring-2 focus:ring-accent/40 focus:outline-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: 'right 0.6rem center',
              backgroundSize: '1.25em 1.25em',
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
      <div className="grid grid-cols-2 gap-2">
        {phase === 'waiting' && (
          <Button size="lg" onClick={() => onStart(preset)} className="col-span-2 w-full">
            Nova partida
          </Button>
        )}

        {phase === 'playing' && (
          <>
            <Button variant="secondary" size="md" onClick={onPause}>
              <IconPause className="size-4" />
              <span>Pausar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onDraw}>
              <IconFlag className="size-4" />
              <span>Empatar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onResign}>
              <IconX className="size-4" />
              <span>Desistir</span>
            </Button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <Button size="md" onClick={onResume}>
              <IconPlay className="size-4" />
              <span>Retomar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onDraw}>
              <IconFlag className="size-4" />
              <span>Empatar</span>
            </Button>
            <Button variant="ghost" size="md" onClick={onResign}>
              <IconX className="size-4" />
              <span>Desistir</span>
            </Button>
          </>
        )}

        {phase === 'finished' && (
          <Button variant="secondary" size="md" onClick={onRestart}>
            <IconRotateCcw className="size-4" />
            <span>Reiniciar</span>
          </Button>
        )}

        {/* Always show new game button */}
        <Button variant="ghost" size="md" onClick={onNewGame}>
          <IconRefreshCw className="size-4" />
          <span>Nova partida</span>
        </Button>
      </div>
    </div>
  );
}