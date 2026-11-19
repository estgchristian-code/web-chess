import { cn } from '@/lib/cn';
import type { GamePhase } from '@/store/game';

export type PlayerSide = 'white' | 'black';
export type PlayerResult = 'win' | 'loss' | 'draw' | null;

type PlayerCardBaseProps = {
  side: PlayerSide;
  name: string;
  rating?: number;
  time: string;
  active?: boolean;
  result?: PlayerResult;
  onResign?: () => void;
  onDraw?: () => void;
};

type PlayerCardProps = PlayerCardBaseProps & { phase?: GamePhase };

function renderPlayerCard({
  side,
  name,
  rating,
  time,
  active = false,
  result = null,
  onResign,
  onDraw,
  phase = 'waiting',
}: PlayerCardProps) {
  const isWhite = side === 'white';
  const expired = time === '0:00';
  const paused = phase === 'paused';
  const showActions = active && phase === 'playing' && (Boolean(onDraw) || Boolean(onResign));

  const avatarBg = isWhite
    ? 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400'
    : 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900';
  const avatarBorder = isWhite ? 'border-amber-200/80' : 'border-slate-500/70';
  const pieceColor = isWhite ? 'text-amber-700' : 'text-slate-100';

  const clockTone = expired
    ? 'border-danger/45 bg-danger-soft text-danger'
    : paused
      ? 'border-dashed border-line-strong bg-surface-muted/60 text-ink-muted'
      : active
        ? 'border-accent/45 bg-accent-soft text-accent-bright shadow-[0_0_24px_-10px_rgba(74,156,110,0.9)]'
        : 'border-line/80 bg-surface text-ink';

  return (
    <div
      className={cn(
        'flex w-full max-w-[600px] mx-auto items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5',
        'transition-[background-color,border-color,box-shadow] duration-300',
        active
          ? 'border-accent/35 bg-accent-soft/25 shadow-[0_14px_34px_-24px_rgba(74,156,110,0.8)]'
          : 'border-line/60 bg-surface/35',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'relative flex size-11 shrink-0 items-center justify-center rounded-full border-2',
            'shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_16px_-8px_rgba(0,0,0,0.9)]',
            'transition-shadow duration-300',
            avatarBg,
            avatarBorder,
            active && 'ring-2 ring-accent/40',
          )}
        >
          <span
            aria-hidden="true"
            className={cn('select-none text-2xl leading-none font-bold', pieceColor)}
          >
            {isWhite ? '♔' : '♚'}
          </span>
          {result && (
            <span
              className={cn(
                'absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full',
                'border-2 border-surface text-[0.5rem] font-bold shadow-md',
                result === 'win' && 'bg-accent text-white',
                result === 'loss' && 'bg-warning text-white',
                result === 'draw' && 'bg-neutral text-white',
              )}
            >
              {result === 'win' ? '✓' : result === 'loss' ? '✗' : '='}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[0.9375rem] leading-tight font-semibold tracking-tight text-ink">
              {name}
            </p>
            {active && (
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent-bright shadow-[0_0_8px_1px_rgba(126,211,161,0.6)]"
              />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {rating !== undefined && (
              <span className="font-mono text-[0.6875rem] text-ink-muted">{rating}</span>
            )}
            <span className="text-[0.625rem] font-semibold tracking-[0.16em] text-ink-muted/90 uppercase">
              Jogador local
            </span>

            {showActions && (
              <>
                {onDraw && (
                  <button
                    type="button"
                    onClick={onDraw}
                    title="Oferecer empate"
                    className="rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                  >
                    = Empate
                  </button>
                )}
                {onResign && (
                  <button
                    type="button"
                    onClick={onResign}
                    title="Desistir"
                    className="rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium text-warning/90 transition-colors hover:bg-warning-soft hover:text-warning-strong focus-visible:ring-2 focus-visible:ring-warning/40 focus-visible:outline-none"
                  >
                    Desistir
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <span
        className={cn(
          'shrink-0 rounded-xl border px-3 py-1.5 text-right font-mono text-lg font-semibold tracking-tight tabular-nums',
          'transition-[color,background-color,border-color,box-shadow] duration-300',
          clockTone,
        )}
      >
        {time}
      </span>
    </div>
  );
}

export function PlayerCard(props: PlayerCardBaseProps) {
  return renderPlayerCard({ ...props, phase: 'waiting' });
}

export function PlayerCardWithPhase(props: PlayerCardBaseProps & { phase: GamePhase }) {
  return renderPlayerCard(props);
}

export type { PlayerCardProps, PlayerCardBaseProps };
