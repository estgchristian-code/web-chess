import { z } from 'zod';

export const GAME_STORAGE_VERSION = 1;
export const GAME_STORAGE_KEY = 'chess-game-v1';

const MoveRecordSchema = z.object({
  san: z.string(),
  from: z.string(),
  to: z.string(),
  color: z.union([z.literal('w'), z.literal('b')]),
  piece: z.union([
    z.literal('p'),
    z.literal('n'),
    z.literal('b'),
    z.literal('r'),
    z.literal('q'),
    z.literal('k'),
  ]),
  captured: z
    .union([
      z.literal('p'),
      z.literal('n'),
      z.literal('b'),
      z.literal('r'),
      z.literal('q'),
      z.literal('k'),
    ])
    .optional(),
  promotion: z.union([z.literal('q'), z.literal('r'), z.literal('b'), z.literal('n')]).optional(),
  fenBefore: z.string(),
  fenAfter: z.string(),
  flags: z.object({
    capture: z.boolean(),
    enPassant: z.boolean(),
    kingsideCastle: z.boolean(),
    queensideCastle: z.boolean(),
    promotion: z.boolean(),
    bigPawn: z.boolean(),
  }),
});

const ClockSnapshotSchema = z.object({
  preset: z.union([
    z.literal('unlimited'),
    z.literal('5+0'),
    z.literal('10+0'),
    z.literal('15+10'),
  ]),
  whiteMs: z.number(),
  blackMs: z.number(),
  incrementMs: z.number(),
  activeSide: z.union([z.literal('white'), z.literal('black'), z.null()]),
  running: z.boolean(),
  flagged: z.union([z.literal('white'), z.literal('black'), z.null()]),
  finished: z.boolean(),
});

export const PersistedGameSchema = z.object({
  version: z.literal(GAME_STORAGE_VERSION),
  preset: z.union([
    z.literal('unlimited'),
    z.literal('5+0'),
    z.literal('10+0'),
    z.literal('15+10'),
  ]),
  initialFen: z.string(),
  moves: z.array(MoveRecordSchema),
  clock: ClockSnapshotSchema,
  phase: z.union([
    z.literal('waiting'),
    z.literal('playing'),
    z.literal('paused'),
    z.literal('finished'),
  ]),
  savedAt: z.number(),
});

export type PersistedGame = z.infer<typeof PersistedGameSchema>;

/** Serializa o estado para o localStorage. Erros de armazenamento são silenciosos. */
export function saveGame(data: PersistedGame): void {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota excedida, modo privado, etc.: ignora silenciosamente.
  }
}

/**
 * Lê e valida o estado persistido. Retorna null quando não há dado, o dado é
 * inválido, a versão é incompatível ou ocorre qualquer erro de leitura/parse.
 * Nunca lança exceção para o chamador.
 */
export function loadGame(): PersistedGame | null {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const result = PersistedGameSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

/** Remove o estado persistido (ex.: ao iniciar uma nova partida do zero). */
export function clearGame(): void {
  try {
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch {
    // ignore
  }
}
