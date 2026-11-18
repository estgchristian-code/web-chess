import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChessBoard } from '@/components/board/ChessBoard';
import { PlayerCard } from '@/components/panels/PlayerCard';
import { IconPause, IconPlay, IconRotateCcw, IconX, IconFlag } from '@/components/ui/icons';
import { groupMoves } from '@/domain/chess/notation';
import type { ClaimableDrawReason } from '@/domain/chess/types';
import { useGameStore } from '@/store/game';

function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return '∞';
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function GameScreen() {
  const {
    phase,
    preset,
    clock,
    history,
    status,
    gameResult,
    startGame,
    pause,
    resume,
    restart,
    resign,
    claimDraw,
  } = useGameStore();

  const [whiteTime, setWhiteTime] = useState(clock.remaining('white'));
  const [blackTime, setBlackTime] = useState(clock.remaining('black'));
  const [activeSide, setActiveSide] = useState<'white' | 'black' | null>(clock.getActiveSide());

  useEffect(() => {
    const interval = setInterval(() => {
      setWhiteTime(clock.remaining('white'));
      setBlackTime(clock.remaining('black'));
      setActiveSide(clock.getActiveSide());
    }, 200);

    return () => clearInterval(interval);
  }, [clock]);

  const movePairs = groupMoves(history);

  const engine = useGameStore.getState().engine;
  const isWhiteTurn = status.status.kind === 'playing' && engine.turn() === 'w';

  const handleStart = () => startGame(preset);

  const handleResign = () => {
    if (confirm('Tem certeza que deseja desistir?')) {
      resign();
    }
  };

  const handleDrawClaim = () => {
    const claims = status.claims;
    if (claims.length === 0) return;

    const reason = claims[0] as ClaimableDrawReason;
    const reasonLabels: Record<string, string> = {
      'threefold-repetition': 'Repetição tripla',
      'fifty-move-rule': 'Regra dos 50 lances',
    };

    if (confirm(`Reivindicar empate por ${reasonLabels[reason] || reason}?`)) {
      claimDraw(reason);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-canvas/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <svg
              className="size-6 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3.5 5 6.2v5.1c0 4.2 2.9 7.6 7 9.2 4.1-1.6 7-5 7-9.2V6.2L12 3.5Z" />
              <path d="m9.2 11.6 2 2.1 3.6-4" />
            </svg>
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">Xadrez</span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
            <span className="hidden text-xs font-medium text-ink-muted sm:block">jogo local</span>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'finished' && gameResult && (
              <Badge tone="accent" className="text-xs">
                {gameResult.kind === 'checkmate'
                  ? `Xeque-mate — ${gameResult.winner === 'w' ? 'Brancas' : 'Negras'} vencem`
                  : gameResult.kind === 'timeout'
                    ? `Tempo esgotado — ${gameResult.winner === 'w' ? 'Brancas' : 'Negras'} vencem`
                    : gameResult.kind === 'resignation'
                      ? `Desistência — ${gameResult.winner === 'w' ? 'Brancas' : 'Negras'} vencem`
                      : `Empate — ${gameResult.reason}`}
              </Badge>
            )}
            {phase === 'playing' && status.status.kind === 'playing' && status.details.inCheck && (
              <Badge tone="accent" className="text-xs">
                Xeque!
              </Badge>
            )}
            {phase === 'paused' && (
              <Badge tone="neutral" className="text-xs">
                Pausado
              </Badge>
            )}
            {phase === 'waiting' && (
              <Badge tone="neutral" className="text-xs">
                Aguardando início
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8 lg:py-8">
          <section className="flex flex-col items-center gap-4">
            <ChessBoard />

            <div className="flex items-center justify-center gap-3 w-full max-w-[480px]">
              {phase === 'waiting' && (
                <Button size="lg" onClick={handleStart}>
                  Nova partida
                </Button>
              )}

              {phase === 'playing' && (
                <>
                  <Button variant="secondary" size="md" onClick={pause}>
                    <IconPause className="size-4" />
                    Pausar
                  </Button>
                  <Button variant="ghost" size="md" onClick={handleResign}>
                    <IconX className="size-4" />
                    Desistir
                  </Button>
                </>
              )}

              {phase === 'paused' && (
                <>
                  <Button size="md" onClick={resume}>
                    <IconPlay className="size-4" />
                    Retomar
                  </Button>
                  <Button variant="ghost" size="md" onClick={handleResign}>
                    <IconX className="size-4" />
                    Desistir
                  </Button>
                </>
              )}

              {phase === 'finished' && (
                <Button variant="secondary" size="md" onClick={restart}>
                  <IconRotateCcw className="size-4" />
                  Reiniciar
                </Button>
              )}

              <Button variant="ghost" size="md" onClick={restart}>
                <IconRotateCcw className="size-4" />
                Nova partida
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-ink-muted w-full max-w-[480px]">
              <span>Preset: {preset}</span>
              {status.claims.length > 0 && phase !== 'finished' && (
                <Button variant="ghost" size="sm" onClick={handleDrawClaim}>
                  <IconFlag className="size-3.5" />
                  Reivindicar empate
                </Button>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-4 w-full lg:w-[400px]">
            <div className="space-y-2">
              <PlayerCard
                side="black"
                name="Negras"
                detail="Jogador 2"
                time={formatMs(blackTime)}
                active={activeSide === 'black' && phase === 'playing'}
              />
              <PlayerCard
                side="white"
                name="Brancas"
                detail="Jogador 1"
                time={formatMs(whiteTime)}
                active={activeSide === 'white' && phase === 'playing'}
              />
            </div>

            <Card className="flex-1 min-h-[200px] overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <p className="text-[0.6875rem] font-medium tracking-wider text-ink-muted uppercase">
                  Histórico
                </p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[300px]">
                {movePairs.length > 0 ? (
                  <ol className="space-y-1.5">
                    {movePairs.map((pair, index) => (
                      <li
                        key={index}
                        className="grid grid-cols-[1.75rem_1fr_1fr] items-baseline text-sm"
                      >
                        <span className="text-xs text-ink-muted tabular-nums">{index + 1}.</span>
                        <span className="font-medium text-ink">{pair.white?.san ?? ''}</span>
                        <span className="font-medium text-ink">{pair.black?.san ?? ''}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-center text-sm text-ink-muted py-8">Nenhum lance ainda</p>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.6875rem] font-medium tracking-wider text-ink-muted uppercase">
                      Configuração
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">Preset do relógio</p>
                  </div>
                  <Badge tone="neutral">{preset}</Badge>
                </div>

                <div className="border-t border-line pt-4 space-y-2">
                  <p className="text-[0.6875rem] font-medium tracking-wider text-ink-muted uppercase">
                    Status
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Fase</dt>
                      <dd className="font-medium text-ink capitalize">{phase}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Vez</dt>
                      <dd className="font-medium text-ink">
                        {status.status.kind === 'playing'
                          ? isWhiteTurn
                            ? 'Brancas'
                            : 'Negras'
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Xeque</dt>
                      <dd className="font-medium text-ink">{status.details.inCheck ? 'Sim' : 'Não'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Repetições</dt>
                      <dd className="font-medium text-ink tabular-nums">{status.details.repetitionCount}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Meio-lances sem captura/peão</dt>
                      <dd className="font-medium text-ink tabular-nums">{status.details.halfmoveClock}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-5 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Sem contas, sem servidores. A partida fica neste dispositivo.</p>
          <p>Partida salva automaticamente no navegador.</p>
        </div>
      </footer>
    </div>
  );
}