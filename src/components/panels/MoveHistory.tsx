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
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <span className="text-4xl opacity-30 mb-2" aria-hidden="true">♟</span>
        <p className="text-sm text-ink-muted">Nenhum lance ainda</p>
        <p className="text-xs text-ink-muted/60 mt-1">Clique em uma peça para começar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
      {pairs.map((pair, index) => (
        <div
          key={index}
          className={cn(
            'grid grid-cols-[1.75rem_1fr_1fr] items-baseline gap-1 text-sm',
            index === Math.floor((lastMoveIndex ?? -1) / 2) && 'bg-accent-soft/50 rounded-lg px-1.5',
          )}
        >
          <span className="text-xs text-ink-muted/60 font-mono tabular-nums text-right pr-1">
            {pair.index}.
          </span>
          <span
            className={cn(
              'font-medium text-ink truncate',
              index === Math.floor((lastMoveIndex ?? -1) / 2) && lastMoveIndex !== undefined && lastMoveIndex % 2 === 0 && 'text-accent-strong',
            )}
          >
            {pair.white?.san ?? ''}
          </span>
          <span
            className={cn(
              'font-medium text-ink truncate',
              index === Math.floor((lastMoveIndex ?? -1) / 2) && lastMoveIndex !== undefined && lastMoveIndex % 2 === 1 && 'text-accent-strong',
            )}
          >
            {pair.black?.san ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}