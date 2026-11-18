/**
 * Vocabulário do domínio de xadrez.
 *
 * Nenhuma regra de movimentação vive aqui: as regras são delegadas ao chess.js
 * em `engine.ts`. Este arquivo apenas fixa os tipos compartilhados entre o
 * motor, o status, a notação e o sistema de relógio.
 */

export type Color = 'w' | 'b';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type Piece = {
  type: PieceSymbol;
  color: Color;
};

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export type Square = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'}`;

/** Características de um lance, derivadas do chess.js (nunca inferidas manualmente). */
export type MoveFlags = {
  capture: boolean;
  enPassant: boolean;
  kingsideCastle: boolean;
  queensideCastle: boolean;
  promotion: boolean;
  bigPawn: boolean;
};

/**
 * Lance já executado, com o SAN gerado pelo chess.js e as posições antes/depois.
 * É a unidade que o histórico e a persistência vão consumir.
 */
export type MoveRecord = {
  san: string;
  from: Square;
  to: Square;
  color: Color;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: PromotionPiece;
  fenBefore: string;
  fenAfter: string;
  flags: MoveFlags;
};

/** Par de lances para apresentação: `1. e4 e5`. */
export type MovePair = {
  number: number;
  white: MoveRecord | null;
  black: MoveRecord | null;
};

/**
 * Empates por repetição e pela regra dos 50 lances são **reivindicáveis**
 * (FIDE 9.2/9.3); repetição quíntupla e 75 lances são **automáticos**
 * (FIDE 9.6/9.7).
 */
export type DrawReason =
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule'
  | 'fivefold-repetition'
  | 'seventy-five-move-rule';

export type ClaimableDrawReason = Extract<
  DrawReason,
  'threefold-repetition' | 'fifty-move-rule'
>;

export type GameResult =
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'draw'; reason: DrawReason }
  | { kind: 'timeout'; winner: Color }
  | { kind: 'resignation'; winner: Color };

/**
 * `playing` indica partida em andamento (com ou sem xeque).
 * `finished` só é usado para términos automáticos; empates reivindicáveis
 * aparecem em `StatusReport.claims` e não encerram a partida.
 */
export type GameStatus =
  | { kind: 'playing'; check: boolean }
  | { kind: 'finished'; result: GameResult };

export type StatusReport = {
  status: GameStatus;
  claims: ClaimableDrawReason[];
  details: {
    inCheck: boolean;
    insufficientMaterial: boolean;
    repetitionCount: number;
    halfmoveClock: number;
  };
};
