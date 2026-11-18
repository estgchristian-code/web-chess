import {
  CLOCK_PRESETS,
  opponentSide,
  type ClockPreset,
  type ClockSide,
  type ClockSnapshot,
  type ClockToggleResult,
  DEFAULT_PRESET,
} from './types';

const MS_PER_MINUTE = 60_000;

/** Tempo inicial do preset. 'unlimited' nunca esgota. */
function baseMsFor(preset: ClockPreset): number {
  const def = CLOCK_PRESETS[preset];

  if (def.baseMinutes === 'infinite') {
    return Number.POSITIVE_INFINITY;
  }

  return def.baseMinutes * MS_PER_MINUTE;
}

/**
 * Relógio analógico de xadrez (FIDE 6.x).
 *
 * - Baseado em timestamps: consome o tempo do lado ativo apenas entre
 *   `lastUpdateAt` e o instante atual.
 *   Nunca permite tempo negativo (clamp em zero).
 *   O incremento é adicionado ao lado que acabou de jogar, no `toggle()`.
 *   `now` é injetável para testes determinísticos.
 */
export class ChessClock {
  private readonly now: () => number;
  private preset: ClockPreset;
  private incrementMs: number;
  private whiteMs: number;
  private blackMs: number;
  private activeSide: ClockSide | null = null;
  private running = false;
  private lastUpdateAt: number | null = null;
  private flagged: ClockSide | null = null;
  private finished = false;

  constructor(preset: ClockPreset = DEFAULT_PRESET, options?: { now?: () => number }) {
    this.now = options?.now ?? (() => Date.now());
    this.preset = preset;
    this.incrementMs = CLOCK_PRESETS[preset].incrementSeconds * 1000;
    this.whiteMs = baseMsFor(preset);
    this.blackMs = baseMsFor(preset);
  }

  getPreset(): ClockPreset {
    return this.preset;
  }

  getIncrementSeconds(): number {
    return this.incrementMs / 1000;
  }

  /** Inicia o relógio com as brancas jogando primeiro (clique em Iniciar). */
  start(): void {
    if (this.finished) {
      return;
    }

    this.running = true;

    if (this.activeSide === null) {
      this.activeSide = 'white';
    }

    this.lastUpdateAt = this.now();
  }

  /** Pausa o relógio sem alterar os saldos. */
  pause(): void {
    if (!this.running) {
      return;
    }

    this.consume(this.activeSide!, this.now());
    this.running = false;
  }

  /** Retorna a contagem do ponto onde parou. */
  resume(): void {
    if (this.running || this.finished || this.activeSide === null) {
      return;
    }

    this.running = true;
    this.lastUpdateAt = this.now();
  }

  /**
   * Alterna o lado após um lance: consome o tempo de quem acabou de jogar,
   * aplica o incremento a esse lado e passa o turno ao adversário.
   */
  toggle(): ClockToggleResult {
    if (!this.running || this.activeSide === null || this.finished) {
      return { flagged: this.flagged, justFlagged: false };
    }

    const now = this.now();
    const side = this.activeSide;
    const justFlagged = this.consume(side, now);

    if (justFlagged) {
      this.flagged = side;
      this.finished = true;
      this.running = false;
      this.activeSide = null;
      return { flagged: side, justFlagged: true };
    }

    if (this.incrementMs > 0) {
      this.addMs(side, this.incrementMs);
    }

    this.activeSide = opponentSide(side);
    this.lastUpdateAt = now;
    return { flagged: null, justFlagged: false };
  }

  /** Marca um lado como esgotado (timeout), encerrando a partida. */
  expire(side: ClockSide): void {
    this.flagged = side;
    this.finished = true;
    this.running = false;
    this.activeSide = null;
  }

  /** Restaura o estado inicial do preset (nova partida). */
  restore(): void {
    this.whiteMs = baseMsFor(this.preset);
    this.blackMs = baseMsFor(this.preset);
    this.activeSide = null;
    this.running = false;
    this.lastUpdateAt = null;
    this.flagged = null;
    this.finished = false;
  }

  /** Restaura o estado interno a partir de um snapshot (desfazer / persistência). */
  restoreFromSnapshot(snapshot: ClockSnapshot): void {
    this.preset = snapshot.preset;
    this.incrementMs = snapshot.incrementMs;
    this.whiteMs = snapshot.whiteMs;
    this.blackMs = snapshot.blackMs;
    this.activeSide = snapshot.activeSide;
    this.running = snapshot.running;
    this.lastUpdateAt = null;
    this.flagged = snapshot.flagged;
    this.finished = snapshot.finished;
  }

  /** Tempo restante do lado, já consumindo o período em andamento se for a vez dele. */
  remaining(side: ClockSide): number {
    const stored = this.sideMs(side);

    if (!this.running || this.activeSide !== side || this.lastUpdateAt === null) {
      return Math.max(0, stored);
    }

    return Math.max(0, stored - (this.now() - this.lastUpdateAt));
  }

  isRunning(): boolean {
    return this.running;
  }

  isFinished(): boolean {
    return this.finished;
  }

  isFlagged(side: ClockSide): boolean {
    return this.flagged === side;
  }

  getActiveSide(): ClockSide | null {
    return this.activeSide;
  }

  snapshot(): ClockSnapshot {
    return {
      preset: this.preset,
      whiteMs: this.remaining('white'),
      blackMs: this.remaining('black'),
      incrementMs: this.incrementMs,
      activeSide: this.activeSide,
      running: this.running,
      flagged: this.flagged,
      finished: this.finished,
    };
  }

  private sideMs(side: ClockSide): number {
    return side === 'white' ? this.whiteMs : this.blackMs;
  }

  private setSideMs(side: ClockSide, value: number): void {
    if (side === 'white') {
      this.whiteMs = value;
    } else {
      this.blackMs = value;
    }
  }

  private addMs(side: ClockSide, value: number): void {
    const current = this.sideMs(side);
    this.setSideMs(side, current === Number.POSITIVE_INFINITY ? current : current + value);
  }

  /**
   * Consome o tempo do lado até `now` e sincroniza `lastUpdateAt`.
   * Retorna true quando o saldo do lado zera no instante (flag).
   */
  private consume(side: ClockSide, now: number): boolean {
    const stored = this.sideMs(side);

    if (!Number.isFinite(stored)) {
      return false; // sem limite: nunca esgota
    }

    const elapsed = this.lastUpdateAt === null ? 0 : now - this.lastUpdateAt;
    const next = Math.max(0, stored - elapsed);

    this.setSideMs(side, next);
    this.lastUpdateAt = now;

    return next === 0 && stored > 0;
  }
}
