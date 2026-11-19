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

  return (
    <div className="flex flex-col h-full w-full bg-canvas">
      {/* Mobile menu bar */}
      {isMobile && (
        <header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="size-9 rounded-lg bg-surface border border-line flex items-center justify-center text-ink hover:bg-surface-muted transition-colors"
              aria-label="Menu"
            >
              {sidebarOpen ? <IconChevronLeft className="size-5" /> : <IconMenu className="size-5" />}
            </button>
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
            'fixed inset-y-0 right-0 z-50 w-80 bg-canvas border-l border-line flex flex-col transition-transform duration-300 ease-out lg:relative lg:translate-x-0 lg:z-auto',
            isMobile && !sidebarOpen && 'translate-x-full',
          )}
          aria-label="Painel lateral"
        >
          <div className="flex flex-col h-full">
            {/* Sidebar header - mobile close button */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-line">
                <h3 className="text-sm font-semibold text-ink">Painel</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="size-8 rounded-lg bg-surface border border-line flex items-center justify-center text-ink hover:bg-surface-muted transition-colors"
                  aria-label="Fechar painel"
                >
                  <IconChevronLeft className="size-5" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Move History */}
              <Card className="flex-1 min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">Histórico</h3>
                  <Badge tone="neutral" className="text-xs">
                    {history.length} lances
                  </Badge>
                </div>
                <MoveHistory moves={history} lastMoveIndex={history.length - 1} />
              </Card>

              {/* Game Controls */}
              <Card>
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
              <Card>
                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">Status</h3>
                  <dl className="space-y-2 text-sm">
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
                      <dt className="text-ink-muted">Meio-lances</dt>
                      <dd className="font-medium text-ink tabular-nums">{status.details.halfmoveClock}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Preset</dt>
                      <dd className="font-medium text-ink font-mono">{preset}</dd>
                    </div>
                  </dl>
                </div>
              </Card>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-w-0 lg:mr-80">
          {/* Board area with player cards top/bottom */}
          <div className="flex flex-col flex-1 items-center justify-center p-4 gap-3 min-h-0">
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
          className="fixed z-50 inset-0 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-label="Confirmar desistência"
          onClick={() => setResignDialogOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-surface rounded-xl border border-line p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Confirmar desistência</h3>
              <button
                onClick={() => setResignDialogOpen(false)}
                className="size-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors flex items-center justify-center"
                aria-label="Cancelar"
              >
                <IconX className="size-5" />
              </button>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Tem certeza que deseja desistir da partida? O adversário será declarado vencedor.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResignDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="secondary" size="sm" onClick={handleResignConfirm}>
                Desistir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Claim Dialog */}
      {drawDialogOpen && (
        <div
          className="fixed z-50 inset-0 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-label="Confirmar empate"
          onClick={() => setDrawDialogOpen(null)}
        >
          <div
            className="relative w-full max-w-sm bg-surface rounded-xl border border-line p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Reivindicar empate</h3>
              <button
                onClick={() => setDrawDialogOpen(null)}
                className="size-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors flex items-center justify-center"
                aria-label="Cancelar"
              >
                <IconX className="size-5" />
              </button>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Reivindicar empate por {drawDialogOpen === 'threefold-repetition' ? 'repetição tripla' : 'regra dos 50 lances'}?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDrawDialogOpen(null)}>
                Cancelar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleDrawConfirm(drawDialogOpen)}>
                Confirmar empate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-line hidden lg:block">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1.5 px-5 py-4 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        </div>
      </footer>
    </div>
  );
}