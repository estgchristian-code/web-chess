import { cn } from '@/lib/cn';
import type { MoveRecord } from '@/domain/chess/types';

type MoveHistoryProps = {
  moves: MoveRecord[];
  lastMoveIndex?: number;
};

function groupMoves(moves: MoveRecord[]) {
  const pairs: Array<{ index: number; white?: MoveRecord; black?: MoveRecord }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      index: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }
  return pairs;
}

export function MoveHistory({ moves, lastMoveIndex }: MoveHistoryProps) {
  const pairs = groupMoves(moves);

  if (moves.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-8 text-center">
        <span
          aria-hidden="true"
          className="mb-3 grid size-12 place-items-center rounded-full border border-line/70 bg-surface-muted/60 text-2xl text-ink-muted/60"
        >
          ♟
        </span>
        <p className="text-sm font-medium text-ink-soft">Nenhum lance ainda</p>
        <p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-ink-muted">
          Clique em uma peça para começar
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-h-[400px] flex-col gap-1 overflow-y-auto pr-1">
      {pairs.map((pair, index) => (
        <div
          key={index}
          className={cn(
            'grid grid-cols-[1.75rem_1fr_1fr] items-baseline gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors',
            index === Math.floor((lastMoveIndex ?? -1) / 2)
              ? 'bg-accent-soft/60 ring-1 ring-accent/20 ring-inset'
              : 'hover:bg-surface-muted/40',
          )}
        >
          <span className="pr-1 text-right font-mono text-xs text-ink-muted/70 tabular-nums">
            {pair.index}.
          </span>
          <span
            className={cn(
              'truncate font-medium text-ink',
              index === Math.floor((lastMoveIndex ?? -1) / 2) &&
                lastMoveIndex !== undefined &&
                lastMoveIndex % 2 === 0 &&
                'text-accent-bright',
            )}
          >
            {pair.white?.san ?? ''}
          </span>
          <span
            className={cn(
              'truncate font-medium text-ink',
              index === Math.floor((lastMoveIndex ?? -1) / 2) &&
                lastMoveIndex !== undefined &&
                lastMoveIndex % 2 === 1 &&
                'text-accent-bright',
            )}
          >
            {pair.black?.san ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}