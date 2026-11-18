import { PlayerCard } from '@/components/panels/PlayerCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconArrowRight, IconClock, IconDevice, IconRules } from '@/components/ui/icons';

const SAMPLE_MOVES: ReadonlyArray<readonly [string, string]> = [
  ['e4', 'e5'],
  ['Nf3', 'Nc6'],
  ['Bb5', 'a6'],
];

const FEATURES = [
  {
    title: 'Regras oficiais',
    description: 'Xeque-mate, empates, roques, en passant e promoção — sem atalhos.',
    icon: <IconRules className="size-5" />,
  },
  {
    title: 'Relógio e histórico',
    description: 'Tempo por jogador, com incremento, e todos os lances em notação algébrica.',
    icon: <IconClock className="size-5" />,
  },
  {
    title: 'Salvo no dispositivo',
    description: 'Recuperação automática ao reabrir o navegador. Nada sai do seu computador.',
    icon: <IconDevice className="size-5" />,
  },
];

export function HomeScreen() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(60% 55% at 50% 0%, var(--color-accent-soft) 0%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pt-12 pb-16 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-16 lg:pt-20 lg:pb-24">
        <section>
          <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-accent uppercase">
            Jogo local · dois jogadores
          </p>

          <h1 className="mt-5 text-[2.5rem] leading-[1.04] font-semibold tracking-tight text-balance text-ink sm:text-[3.25rem] lg:text-[3.5rem]">
            Um tabuleiro.
            <br />
            Dois jogadores.
            <br />
            <span className="text-ink-muted">Zero distrações.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
            Xadrez completo para jogar no mesmo dispositivo. Sem contas, sem servidores — apenas
            você, o adversário e a partida.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button size="lg" disabled>
              Nova partida
            </Button>
            <a
              href="#recursos"
              className="group inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Ver o que vem a seguir
              <IconArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </a>
          </div>

          <p className="mt-3 text-xs text-ink-muted">O tabuleiro será habilitado em breve.</p>

          <ul className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
            <li>Sem contas</li>
            <li aria-hidden="true" className="size-1 rounded-full bg-line-strong" />
            <li>Sem instalação</li>
            <li aria-hidden="true" className="size-1 rounded-full bg-line-strong" />
            <li>Funciona offline</li>
          </ul>
        </section>

        <aside aria-label="Prévia da interface">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-ink">Prévia da partida</p>
                <p className="mt-0.5 text-xs text-ink-muted">Interface em desenvolvimento</p>
              </div>
              <Badge tone="accent">em breve</Badge>
            </div>

            <div className="space-y-1 px-3 py-3">
              <PlayerCard side="black" name="Negras" detail="Jogador 2" time="10:00" />
              <PlayerCard side="white" name="Brancas" detail="Jogador 1" time="10:00" active />
            </div>

            <div className="border-t border-line px-5 py-4">
              <p className="mb-3 text-[0.6875rem] font-medium tracking-wider text-ink-muted uppercase">
                Histórico
              </p>
              <ol className="space-y-1.5">
                {SAMPLE_MOVES.map(([white, black], index) => (
                  <li
                    key={`${white}-${black}`}
                    className="grid grid-cols-[1.75rem_1fr_1fr] items-baseline text-sm"
                  >
                    <span className="text-xs text-ink-muted tabular-nums">{index + 1}.</span>
                    <span className="font-medium text-ink">{white}</span>
                    <span className="font-medium text-ink">{black}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-muted/60 px-5 py-3 text-xs text-ink-muted">
              <span>10 + 0 · Casual</span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                Brancas jogam
              </span>
            </div>
          </Card>
        </aside>
      </div>

      <section
        id="recursos"
        aria-labelledby="recursos-titulo"
        className="scroll-mt-20 border-t border-line/70"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="max-w-xl">
            <h2
              id="recursos-titulo"
              className="text-xl font-semibold tracking-tight text-ink sm:text-2xl"
            >
              O que a versão completa inclui
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              A fundação técnica está pronta. As próximas etapas adicionam o jogo em si.
            </p>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full p-5">
                  <span className="grid size-10 place-items-center rounded-control border border-line bg-surface-muted text-accent">
                    {feature.icon}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {feature.description}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
