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
  const avatarBg = isWhite ? 'bg-gradient-to-br from-amber-100 to-amber-300' : 'bg-gradient-to-br from-slate-700 to-slate-900';
  const avatarBorder = isWhite ? 'border-amber-300' : 'border-slate-600';
  const pieceColor = isWhite ? 'text-amber-600' : 'text-slate-300';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
        active ? 'bg-surface-muted/60 ring-2 ring-accent/40' : 'bg-transparent hover:bg-surface-muted/30',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            'relative size-10 shrink-0 rounded-full border-2 flex items-center justify-center',
            avatarBg,
            avatarBorder,
            active && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
          )}
        >
          <span className={cn('text-xl font-bold select-none', pieceColor)}>
            {side === 'white' ? '♔' : '♚'}
          </span>
          {result && (
            <span
              className={cn(
                'absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-surface flex items-center justify-center text-[0.5rem] font-bold',
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
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {rating !== undefined && (
              <span className="text-xs text-ink-muted font-mono">
                {rating}
              </span>
            )}
            <span className="text-xs text-ink-muted">{side === 'white' ? 'Brancas' : 'Negras'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className={cn(
            'font-mono text-lg font-semibold tabular-nums rounded-lg px-3 py-1.5 border transition-colors',
            active
              ? 'bg-accent-soft border-accent/30 text-accent-strong'
              : 'bg-surface border-line text-ink',
          )}
        >
          {time}
        </span>

        {active && phase === 'playing' && (
          <div className="flex items-center gap-1.5">
            {onDraw && (
              <button
                onClick={onDraw}
                className="px-2 py-1 text-xs text-ink-muted hover:text-ink hover:bg-surface-muted rounded transition-colors"
                title="Oferecer empate"
              >
                = Empate
              </button>
            )}
            {onResign && (
              <button
                onClick={onResign}
                className="px-2 py-1 text-xs text-warning hover:text-warning-strong hover:bg-warning-soft rounded transition-colors"
                title="Desistir"
              >
                Desistir
              </button>
            )}
          </div>
        )}
      </div>
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