import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChessBoard } from '@/components/board/ChessBoard';
import { PlayerCardWithPhase } from '@/components/panels/PlayerCard';
import { MoveHistory } from '@/components/panels/MoveHistory';
import { GameControls } from '@/components/panels/GameControls';
import { IconMenu, IconChevronLeft, IconX } from '@/components/ui/icons';
import type { ClaimableDrawReason } from '@/domain/chess/types';
import type { ClockPreset } from '@/domain/clock/types';
import type { PlayerResult } from '@/components/panels/PlayerCard';
import { cn } from '@/lib/cn';
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
    setPreset,
  } = useGameStore();

  const [whiteTime, setWhiteTime] = useState(clock.remaining('white'));
  const [blackTime, setBlackTime] = useState(clock.remaining('black'));
  const [activeSide, setActiveSide] = useState<'white' | 'black' | null>(clock.getActiveSide());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resignDialogOpen, setResignDialogOpen] = useState(false);
  const [drawDialogOpen, setDrawDialogOpen] = useState<ClaimableDrawReason | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWhiteTime(clock.remaining('white'));
      setBlackTime(clock.remaining('black'));
      setActiveSide(clock.getActiveSide());
    }, 200);

    return () => clearInterval(interval);
  }, [clock]);

  const engine = useGameStore.getState().engine;
  const isWhiteTurn = status.status.kind === 'playing' && engine.turn() === 'w';

  const handleStart = () => startGame(preset);
  const handleNewGame = () => restart();
  const handlePresetChange = (nextPreset: ClockPreset) => {
    setPreset(nextPreset);
    restart();
  };

  const handleResign = () => {
    setResignDialogOpen(true);
  };

  const handleResignConfirm = () => {
    resign();
    setResignDialogOpen(false);
  };

  const handleDrawClaim = () => {
    const claims = status.claims;
    if (claims.length === 0) return;

    const reason = claims[0] as ClaimableDrawReason;
    setDrawDialogOpen(reason);
  };

  const handleDrawConfirm = (reason: ClaimableDrawReason) => {
    claimDraw(reason);
    setDrawDialogOpen(null);
  };

  // Compute player results for badges
  const getPlayerResult = (side: 'white' | 'black'): PlayerResult => {
    if (!gameResult || phase !== 'finished') return null;
    if (gameResult.kind === 'draw') return 'draw';
    const winner = gameResult.winner;
    if (side === 'white') return winner === 'w' ? 'win' : 'loss';
    return winner === 'b' ? 'win' : 'loss';
  };

  const phaseLabel: Record<typeof phase, string> = {
    waiting: 'Aguardando',
    playing: 'Em jogo',
    paused: 'Pausada',
    finished: 'Finalizada',
  };

  return (
    <div className="flex flex-col h-full w-full bg-canvas">
      {/* Mobile menu bar */}
      {isMobile && (
        <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/90 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex size-9 items-center justify-center rounded-control border border-line/80 bg-surface text-ink shadow-sm transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
              aria-label="Menu"
            >
              {sidebarOpen ? <IconChevronLeft className="size-5" /> : <IconMenu className="size-5" />}
            </button>
            <span className="text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
              Painel da partida
            </span>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar (right panel) - Mobile: slide-over, Desktop: fixed */}
        <aside
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-line/80 bg-canvas shadow-[0_0_60px_-20px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out lg:relative lg:z-auto lg:translate-x-0 lg:shadow-none',
            isMobile && !sidebarOpen && 'translate-x-full',
          )}
          aria-label="Painel lateral"
        >
          <div className="flex h-full flex-col">
            {/* Sidebar header - mobile close button */}
            {isMobile && (
              <div className="flex items-center justify-between border-b border-line/80 p-4">
                <h3 className="text-sm font-semibold tracking-tight text-ink">Painel</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex size-8 items-center justify-center rounded-control border border-line/80 bg-surface text-ink transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                  aria-label="Fechar painel"
                >
                  <IconChevronLeft className="size-5" />
                </button>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
              {/* Move History */}
              <Card className="flex min-h-0 flex-col p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-muted uppercase">
                    Histórico
                  </h3>
                  <Badge tone="neutral" className="normal-case">
                    {history.length} lances
                  </Badge>
                </div>
                <MoveHistory moves={history} lastMoveIndex={history.length - 1} />
              </Card>

              {/* Game Controls */}
              <Card className="p-4">
                <GameControls
                  phase={phase}
                  preset={preset}
                  onStart={handleStart}
                  onPause={pause}
                  onResume={resume}
                  onRestart={restart}
                  onResign={handleResign}
                  onDraw={handleDrawClaim}
                  onNewGame={handleNewGame}
                  onPresetChange={handlePresetChange}
                />
              </Card>

              {/* Game Status */}
              <Card className="p-4">
                <h3 className="mb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-muted uppercase">
                  Status
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">Fase</dt>
                    <dd className="font-medium text-ink">{phaseLabel[phase]}</dd>
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
                    <dd
                      className={cn(
                        'font-medium',
                        status.details.inCheck ? 'text-danger' : 'text-ink',
                      )}
                    >
                      {status.details.inCheck ? 'Sim' : 'Não'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">Repetições</dt>
                    <dd className="font-medium text-ink tabular-nums">
                      {status.details.repetitionCount}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">Meio-lances</dt>
                    <dd className="font-medium text-ink tabular-nums">
                      {status.details.halfmoveClock}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">Preset</dt>
                    <dd className="font-mono font-medium text-ink">{preset}</dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Board area with player cards top/bottom */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3.5 p-4 sm:gap-4 sm:p-6">
            {/* Top player (Black - plays from top) */}
            <PlayerCardWithPhase
              side="black"
              name="Negras"
              time={formatMs(blackTime)}
              active={activeSide === 'black' && phase === 'playing'}
              result={getPlayerResult('black')}
              onResign={handleResign}
              onDraw={handleDrawClaim}
              phase={phase}
            />

            {/* Board */}
            <div className="relative flex-shrink-0 w-full max-w-[600px]">
              <ChessBoard />
            </div>

            {/* Bottom player (White - plays from bottom) */}
            <PlayerCardWithPhase
              side="white"
              name="Brancas"
              time={formatMs(whiteTime)}
              active={activeSide === 'white' && phase === 'playing'}
              result={getPlayerResult('white')}
              onResign={handleResign}
              onDraw={handleDrawClaim}
              phase={phase}
            />
          </div>
        </main>
      </div>

      {/* Resignation Dialog */}
      {resignDialogOpen && (
        <div
          className="animate-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar desistência"
          onClick={() => setResignDialogOpen(false)}
        >
          <div
            className="animate-dialog-panel relative w-full max-w-sm rounded-2xl border border-line/80 bg-surface p-5 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold tracking-tight text-ink">Confirmar desistência</h3>
              <button
                type="button"
                onClick={() => setResignDialogOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                aria-label="Cancelar"
              >
                <IconX className="size-5" />
              </button>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-ink-soft">
              Tem certeza que deseja desistir da partida? O adversário será declarado vencedor.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResignDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleResignConfirm}
              >
                Desistir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Claim Dialog */}
      {drawDialogOpen && (
        <div
          className="animate-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar empate"
          onClick={() => setDrawDialogOpen(null)}
        >
          <div
            className="animate-dialog-panel relative w-full max-w-sm rounded-2xl border border-line/80 bg-surface p-5 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold tracking-tight text-ink">Reivindicar empate</h3>
              <button
                type="button"
                onClick={() => setDrawDialogOpen(null)}
                className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                aria-label="Cancelar"
              >
                <IconX className="size-5" />
              </button>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-ink-soft">
              Reivindicar empate por{' '}
              {drawDialogOpen === 'threefold-repetition'
                ? 'repetição tripla'
                : 'regra dos 50 lances'}
              ?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDrawDialogOpen(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleDrawConfirm(drawDialogOpen)}>
                Confirmar empate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}