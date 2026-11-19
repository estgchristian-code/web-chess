import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Chessboard } from 'react-chessboard';

import { useGameStore } from '@/store/game';
import type { Square } from '@/domain/chess/types';
import { Button } from '@/components/ui/Button';
import { IconRotateCcw, IconX } from '@/components/ui/icons';

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
      styles[lastMove.from] = {
        backgroundColor: 'rgba(212, 168, 67, 0.24)',
        boxShadow: 'inset 0 0 0 1px rgba(212, 168, 67, 0.35)',
      };
      styles[lastMove.to] = {
        backgroundColor: 'rgba(212, 168, 67, 0.24)',
        boxShadow: 'inset 0 0 0 1px rgba(212, 168, 67, 0.35)',
      };
    }

    // Check highlight
    if (checkedKingSquare) {
      styles[checkedKingSquare] = {
        ...styles[checkedKingSquare],
        backgroundColor: 'rgba(196, 92, 74, 0.32)',
        backgroundImage:
          'radial-gradient(circle at center, rgba(196, 92, 74, 0.35) 0%, transparent 70%)',
        boxShadow: 'inset 0 0 0 2px rgba(196, 92, 74, 0.85)',
      };
    }

    // Checkmate highlight (pulsing red)
    if (checkmateSquare) {
      styles[checkmateSquare] = {
        ...styles[checkmateSquare],
        backgroundColor: 'rgba(196, 92, 74, 0.38)',
        boxShadow: 'inset 0 0 0 3px rgba(196, 92, 74, 0.9), 0 0 12px rgba(196, 92, 74, 0.5)',
        animation: 'pulse-checkmate 1.2s ease-in-out infinite',
      };
    }

    // Selected piece
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(74, 156, 110, 0.3)',
        boxShadow: 'inset 0 0 0 3px rgba(74, 156, 110, 0.95)',
      };
    }

    // Legal move highlights
    for (const target of legalMoveTargets) {
      const piece = engine.pieceAt(target as Square);
      if (piece) {
        // Enemy piece: capture indicator (ring)
        styles[target] = {
          ...styles[target],
          boxShadow: 'inset 0 0 0 3px rgba(74, 156, 110, 0.85)',
        };
      } else {
        // Empty square: dot
        styles[target] = {
          ...styles[target],
          backgroundImage:
            'radial-gradient(circle at center, rgba(74, 156, 110, 0.85) 0 13%, rgba(74, 156, 110, 0.3) 14% 22%, transparent 23%)',
        };
      }
    }

    // Promotion highlight
    if (promotionSquare) {
      styles[promotionSquare] = {
        ...styles[promotionSquare],
        backgroundColor: 'rgba(74, 156, 110, 0.28)',
        boxShadow: 'inset 0 0 0 3px rgba(74, 156, 110, 0.9)',
      };
    }

    return styles;
  }, [
    legalMoveTargets,
    engine,
    lastMove,
    checkedKingSquare,
    selectedSquare,
    promotionSquare,
    checkmateSquare,
  ]);

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
    <div className="relative flex flex-col items-center gap-3">
      <div data-testid="chessboard-board" className="relative w-full">
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
            boardStyle: {
              borderRadius: '0.875rem',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-board)',
            },
            lightSquareStyle: { backgroundColor: 'var(--color-board-light)' },
            darkSquareStyle: { backgroundColor: 'var(--color-board-dark)' },
            dropSquareStyle: {
              boxShadow: 'inset 0 0 0 3px rgba(74, 156, 110, 0.55)',
            },
            lightSquareNotationStyle: { color: 'var(--color-board-notation-light)' },
            darkSquareNotationStyle: { color: 'var(--color-board-notation-dark)' },
            alphaNotationStyle: { fontSize: '0.6875rem', fontWeight: 600 },
            numericNotationStyle: { fontSize: '0.6875rem', fontWeight: 600 },
            animationDurationInMs: 180,
            draggingPieceStyle: {
              transform: 'scale(1.12)',
              filter: 'drop-shadow(0 10px 16px rgba(0, 0, 0, 0.45))',
            },
            draggingPieceGhostStyle: { opacity: 0.35 },
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
      <div className="flex items-center justify-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            undoMove();
            setSelectedSquare(null);
          }}
          disabled={phase === 'waiting'}
        >
          <IconRotateCcw className="size-3.5" />
          Desfazer
        </Button>
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
      className="animate-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Escolha a peça para promoção"
      onClick={onCancel}
    >
      <div
        className="animate-dialog-panel relative w-full max-w-sm rounded-2xl border border-line/80 bg-surface p-5 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight text-ink">Promover peão</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
            aria-label="Cancelar"
          >
            <IconX className="size-5" />
          </button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-ink-soft">Escolha a peça para promoção</p>
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {pieceOptions.map(({ piece, label, symbol }) => (
            <button
              key={piece}
              type="button"
              onClick={() => onSelect(piece)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-line/80 bg-surface-muted/30 px-3 py-3 text-left text-sm font-medium text-ink transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-accent/40 hover:bg-surface-muted hover:shadow-card active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
            >
              <span className="text-3xl" aria-hidden="true">
                {symbol}
              </span>
              <span className="text-xs font-medium text-ink-muted">{label}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}