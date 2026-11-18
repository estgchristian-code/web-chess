import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Chessboard } from 'react-chessboard';

import { useGameStore } from '@/store/game';
import type { Square } from '@/domain/chess/types';
import { IconX } from '@/components/ui/icons';

export function ChessBoard() {
  const { engine, phase, playMove, undoMove } = useGameStore();
  const [orientation, setOrientation] = useState<'white' | 'black'>(() =>
    useGameStore.getState().engine.turn() === 'w' ? 'white' : 'black'
  );
  const [promotionSquare, setPromotionSquare] = useState<Square | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      setOrientation(state.engine.turn() === 'w' ? 'white' : 'black');
    });
    return unsubscribe;
  }, []);

  // Clear selection when phase changes, move is made, or turn changes
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      if (state.phase !== phase || state.engine.turn() !== engine.turn()) {
        setSelectedSquare(null);
      }
    });
    return unsubscribe;
  }, [phase, engine]);

  // Track drag state to avoid click-drag conflicts
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pieceClickRef = useRef<Square | null>(null);

  const handleMouseDown = useCallback(
    ({ piece, square }: { piece: { pieceType: string } | null; square: string }, e: React.MouseEvent) => {
      if (phase !== 'playing') return;
      dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      // Track if we clicked on a piece (potential drag start)
      if (piece) {
        pieceClickRef.current = square as Square;
      }
    },
    [phase]
  );

  const handleMouseUp = useCallback(
    ({ square }: { piece: { pieceType: string } | null; square: string }, e: React.MouseEvent) => {
      if (phase !== 'playing') return;

      const start = dragStartRef.current;
      dragStartRef.current = null;
      pieceClickRef.current = null;

      if (!start) return;

      // Calculate movement and time
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - start.time;

      // Consider it a click if minimal movement and short time
      // dragActivationDistance is ~10px by default, we use 8px threshold
      const isClick = distance < 8 && elapsed < 300;

      if (isClick) {
        const targetSquare = square as Square;
        const turn = engine.turn();
        const piece = engine.pieceAt(targetSquare);

        // Click on same square: deselect
        if (selectedSquare === targetSquare) {
          setSelectedSquare(null);
          return;
        }

        // Click on own piece: select it
        if (piece && piece.color === turn) {
          setSelectedSquare(targetSquare);
          return;
        }

        // Click on destination square when piece is selected: execute move
        if (selectedSquare) {
          const legalMoves = engine.legalMoves(selectedSquare);
          const matchedMove = legalMoves.find((m) => m.to === targetSquare);
          if (matchedMove) {
            // Execute the move
            const result = playMove({
              from: selectedSquare,
              to: targetSquare,
              promotion: matchedMove.promotion,
            });

            if (result.ok) {
              if (result.move.flags.promotion && !promotionSquare) {
                // Promotion needed - show dialog
                setPendingMove({ from: selectedSquare, to: targetSquare });
                setPromotionSquare(targetSquare);
              } else {
                // Normal move completed
                setSelectedSquare(null);
              }
            }
            return;
          }
        }

        // Click on empty square or opponent piece without selection: deselect
        setSelectedSquare(null);
      }
    },
    [phase, engine, selectedSquare, playMove, promotionSquare]
  );

  // Check for checkmate and update checkmate square
  const checkmateSquare = useMemo(() => {
    const status = engine.status();
    if (status.status.kind === 'finished' && status.status.result?.kind === 'checkmate') {
      const turn = engine.turn();
      const opponentTurn = turn === 'w' ? 'b' : 'w';
      // Find the king that is checkmated
      const squares: Square[] = [
        'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
        'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
        'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
        'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
        'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
        'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
        'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
        'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
      ];
      for (const sq of squares) {
        const piece = engine.pieceAt(sq);
        if (piece && piece.type === 'k' && piece.color === opponentTurn) {
          return sq;
        }
      }
    }
    return null;
  }, [engine]);

  // Compute legal move targets for selected piece
  const legalMoveTargets = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    return new Set(engine.legalMoves(selectedSquare).map((m) => m.to));
  }, [engine, selectedSquare]);

  // Get last move for highlight
  const lastMove = useMemo(() => {
    const history = engine.history();
    return history.length > 0 ? history[history.length - 1] : null;
  }, [engine]);

  // Get king in check square
  const checkedKingSquare = useMemo(() => {
    const status = engine.status();
    if (!status.details.inCheck) return null;
    const turn = engine.turn();
    const squares: Square[] = [
      'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
      'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
      'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
      'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
      'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
      'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
      'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
    ];
    for (const sq of squares) {
      const piece = engine.pieceAt(sq);
      if (piece && piece.type === 'k' && piece.color === turn) {
        return sq;
      }
    }
    return null;
  }, [engine]);

  // Build square styles
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Last move highlight
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.25)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.25)' };
    }

    // Check highlight
    if (checkedKingSquare) {
      styles[checkedKingSquare] = {
        ...styles[checkedKingSquare],
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        boxShadow: 'inset 0 0 0 2px rgba(255, 0, 0, 0.8)',
      };
    }

    // Checkmate highlight (pulsing red)
    if (checkmateSquare) {
      styles[checkmateSquare] = {
        ...styles[checkmateSquare],
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        boxShadow: 'inset 0 0 0 3px rgba(255, 0, 0, 0.9), 0 0 10px rgba(255, 0, 0, 0.5)',
        animation: 'pulse-checkmate 1s ease-in-out infinite',
      };
    }

    // Legal move highlights
    for (const target of legalMoveTargets) {
      const piece = engine.pieceAt(target as Square);
      if (piece) {
        // Enemy piece: capture indicator (ring)
        styles[target] = {
          ...styles[target],
          boxShadow: 'inset 0 0 0 3px rgba(255, 100, 100, 0.9)',
        };
      } else {
        // Empty square: dot
        styles[target] = {
          ...styles[target],
          backgroundImage: 'radial-gradient(circle at center, rgba(100, 200, 100, 0.6) 0%, transparent 70%)',
        };
      }
    }

    // Promotion highlight
    if (promotionSquare) {
      styles[promotionSquare] = {
        ...styles[promotionSquare],
        backgroundColor: 'rgba(255, 255, 0, 0.3)',
      };
    }

    return styles;
  }, [legalMoveTargets, engine, lastMove, checkedKingSquare, promotionSquare, checkmateSquare]);

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

      setSelectedSquare(null);
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
            dragActivationDistance: 10,
            onPieceDrop: handlePieceDrop,
            onSquareMouseDown: handleMouseDown,
            onSquareMouseUp: handleMouseUp,
            squareStyles,
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
            setSelectedSquare(null);
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
      className="fixed z-50 inset-0 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-label="Escolha a peça para promoção"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm bg-surface rounded-xl border border-line p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Promover peão</h3>
          <button
            onClick={onCancel}
            className="size-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors flex items-center justify-center"
            aria-label="Cancelar"
          >
            <IconX className="size-5" />
          </button>
        </div>
        <p className="text-xs text-ink-muted mb-3">Escolha a peça para promoção</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {pieceOptions.map(({ piece, label, symbol }) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="flex flex-col items-center gap-1.5 px-3 py-3 text-left text-sm font-medium text-ink hover:bg-surface-muted rounded-xl border border-line transition-all duration-150 hover:border-accent/30 hover:shadow-md"
            >
              <span className="text-3xl" aria-hidden="true">
                {symbol}
              </span>
              <span className="text-xs font-medium text-ink-muted">{label}</span>
            </button>
          ))}
        <button
          onClick={onCancel}
          className="w-full px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-muted rounded-xl border border-line transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
  );
}