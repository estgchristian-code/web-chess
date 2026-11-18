import { useCallback, useEffect, useState } from 'react';

import { Chessboard } from 'react-chessboard';

import { useGameStore } from '@/store/game';
import type { Square } from '@/domain/chess/types';

export function ChessBoard() {
  const { engine, phase, playMove, undoMove } = useGameStore();
  const [orientation, setOrientation] = useState<'white' | 'black'>(() =>
    useGameStore.getState().engine.turn() === 'w' ? 'white' : 'black'
  );
  const [promotionSquare, setPromotionSquare] = useState<Square | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      setOrientation(state.engine.turn() === 'w' ? 'white' : 'black');
    });
    return unsubscribe;
  }, []);

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
      if (!targetSquare) return false;

      const result = playMove({ from: sourceSquare as Square, to: targetSquare as Square });

      if (!result.ok) {
        if (result.reason === 'game-over') {
          return false;
        }
        return false;
      }

      if (result.move.flags.promotion && !pendingMove) {
        setPendingMove({ from: sourceSquare as Square, to: targetSquare as Square });
        setPromotionSquare(targetSquare as Square);
        return false;
      }

      return true;
    },
    [playMove, pendingMove]
  );

  const handlePromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (pendingMove && promotionSquare) {
        const result = playMove({
          from: pendingMove.from,
          to: promotionSquare,
          promotion: piece,
        });
        if (result.ok) {
          // lastMove not used
        }
      }
      setPromotionSquare(null);
      setPendingMove(null);
    },
    [playMove, pendingMove, promotionSquare]
  );

  const handlePromotionCancel = useCallback(() => {
    setPromotionSquare(null);
    setPendingMove(null);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div data-testid="chessboard-board" className="relative">
        <Chessboard
          data-testid="chessboard-board"
          options={{
            position: engine.fen().split(' ')[0],
            boardOrientation: orientation,
            allowDragging: phase === 'playing',
            onPieceDrop: handlePieceDrop,
            squareStyles: {
              ...(promotionSquare && {
                [promotionSquare]: {
                  backgroundColor: 'rgba(255, 255, 0, 0.3)',
                },
              }),
            },
          }}
        />
        {promotionSquare && (
          <PromotionDialog
            color={engine.turn()}
            onSelect={handlePromotion}
            onCancel={handlePromotionCancel}
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
        <button
          onClick={() => {
            undoMove();
          }}
          disabled={phase === 'waiting'}
          className="px-3 py-1.5 rounded-control border border-line-strong bg-surface text-ink hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          Desfazer
        </button>
      </div>
    </div>
  );
}

function PromotionDialog({
  color,
  onSelect,
  onCancel,
}: {
  color: 'w' | 'b';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}) {
  const pieceOptions = [
    { piece: 'q' as const, label: 'Dama', symbol: color === 'w' ? '♕' : '♛' },
    { piece: 'r' as const, label: 'Torre', symbol: color === 'w' ? '♖' : '♜' },
    { piece: 'b' as const, label: 'Bispo', symbol: color === 'w' ? '♗' : '♝' },
    { piece: 'n' as const, label: 'Cavalo', symbol: color === 'w' ? '♘' : '♞' },
  ];

  return (
    <div
      className="fixed z-50 flex flex-col gap-1 rounded-lg border border-line bg-surface p-2 shadow-lg"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      role="dialog"
      aria-label="Escolha a peça para promoção"
    >
      {pieceOptions.map(({ piece, label, symbol }) => (
        <button
          key={piece}
          onClick={() => onSelect(piece)}
          className="flex items-center gap-3 px-3 py-2 text-left text-sm font-medium text-ink hover:bg-surface-muted rounded-control transition-colors"
        >
          <span className="text-2xl" aria-hidden="true">
            {symbol}
          </span>
          {label}
        </button>
      ))}
      <button
        onClick={onCancel}
        className="mt-1 px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-muted rounded-control transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}