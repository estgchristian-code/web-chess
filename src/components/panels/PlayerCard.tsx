import { cn } from '@/lib/cn';

export type PlayerSide = 'white' | 'black';

type PlayerCardProps = {
  side: PlayerSide;
  name: string;
  detail?: string;
  time: string;
  active?: boolean;
};

export function PlayerCard({ side, name, detail, time, active = false }: PlayerCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-control px-2 py-2 transition-colors',
        active ? 'bg-surface-muted/80' : 'bg-transparent',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'size-8 shrink-0 rounded-full border',
            side === 'white' ? 'border-line-strong bg-[#f7f4ea]' : 'border-ink/60 bg-ink',
          )}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          {detail ? <p className="truncate text-xs text-ink-muted">{detail}</p> : null}
        </div>
      </div>

      <span
        className={cn(
          'rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums',
          active
            ? 'border-accent/25 bg-accent-soft text-accent-strong'
            : 'border-line bg-surface text-ink-soft',
        )}
      >
        {time}
      </span>
    </div>
  );
}
