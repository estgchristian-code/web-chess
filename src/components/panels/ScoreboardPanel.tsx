import { Card } from '@/components/ui/Card';
import { useScoreboardStore } from '@/store/scoreboard';

type ScoreTileProps = {
  label: string;
  value: number;
  testId: string;
  accent?: boolean;
};

function ScoreTile({ label, value, testId, accent = false }: ScoreTileProps) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface-muted/25 px-2.5 py-2">
      <dt className="text-[0.625rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        {label}
      </dt>
      <dd
        data-testid={testId}
        className={
          accent
            ? 'mt-0.5 font-mono text-lg leading-none font-semibold text-accent-bright tabular-nums'
            : 'mt-0.5 font-mono text-lg leading-none font-semibold text-ink tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function ScoreboardPanel() {
  const whiteWins = useScoreboardStore((state) => state.whiteWins);
  const blackWins = useScoreboardStore((state) => state.blackWins);
  const draws = useScoreboardStore((state) => state.draws);
  const total = useScoreboardStore((state) => state.total);

  return (
    <Card className="p-4" data-testid="scoreboard-panel">
      <h3 className="mb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-muted uppercase">
        Placar
      </h3>
      <dl className="grid grid-cols-2 gap-2">
        <ScoreTile label="Brancas" value={whiteWins} testId="scoreboard-white" />
        <ScoreTile label="Negras" value={blackWins} testId="scoreboard-black" />
        <ScoreTile label="Empates" value={draws} testId="scoreboard-draws" />
        <ScoreTile label="Concluídas" value={total} testId="scoreboard-total" accent />
      </dl>
    </Card>
  );
}
