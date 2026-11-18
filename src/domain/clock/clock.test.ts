import { describe, expect, it } from 'vitest';

import { ChessClock } from './clock';
import { CLOCK_PRESETS, DEFAULT_PRESET } from './types';

function clockWithTime(nowFactory: () => number): ChessClock {
  return new ChessClock('10+0', { now: nowFactory });
}

describe('presets', () => {
  it('define os presets sem limite, 5+0, 10+0 (padrão) e 15+10', () => {
    expect(CLOCK_PRESETS.unlimited).toEqual({
      baseMinutes: 'infinite',
      incrementSeconds: 0,
    });
    expect(CLOCK_PRESETS['5+0']).toEqual({ baseMinutes: 5, incrementSeconds: 0 });
    expect(CLOCK_PRESETS['10+0']).toEqual({ baseMinutes: 10, incrementSeconds: 0 });
    expect(CLOCK_PRESETS['15+10']).toEqual({ baseMinutes: 15, incrementSeconds: 10 });
  });

  it('o padrão é 10+0', () => {
    expect(DEFAULT_PRESET).toBe('10+0');
    const clock = new ChessClock();

    expect(clock.getPreset()).toBe('10+0');
    expect(clock.getIncrementSeconds()).toBe(0);
    expect(clock.remaining('white')).toBe(10 * 60_000);
    expect(clock.remaining('black')).toBe(10 * 60_000);
  });

  it('sem limite nunca esgota', () => {
    const clock = new ChessClock('unlimited');

    expect(clock.remaining('white')).toBe(Infinity);
    expect(clock.remaining('black')).toBe(Infinity);
    clock.start();
    clock.toggle();
    expect(clock.isFlagged('white')).toBe(false);
    expect(clock.isFinished()).toBe(false);
  });
});

describe('ciclo de vida', () => {
  it('começa parado e inicia com as brancas no clique de Iniciar', () => {
    const now = 100_000_000_000;
    const clock = clockWithTime(() => now);

    expect(clock.isRunning()).toBe(false);
    expect(clock.getActiveSide()).toBeNull();

    clock.start();

    expect(clock.isRunning()).toBe(true);
    expect(clock.getActiveSide()).toBe('white');
    expect(clock.remaining('white')).toBe(10 * 60_000);
  });

  it('não inicia partida já finalizada sem restaurar', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);

    clock.start();
    now += 10 * 60_000 + 1;
    clock.toggle();

    expect(clock.isFinished()).toBe(true);
    clock.start();
    expect(clock.isRunning()).toBe(false);
  });
});

describe('toggle e incremento', () => {
  it('alterna o lado após cada lance', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);

    clock.start();
    now += 30_000;
    const first = clock.toggle();

    expect(first.justFlagged).toBe(false);
    expect(clock.getActiveSide()).toBe('black');
    expect(clock.remaining('white')).toBe(10 * 60_000 - 30_000);

    now += 40_000;
    const second = clock.toggle();

    expect(second.justFlagged).toBe(false);
    expect(clock.getActiveSide()).toBe('white');
    expect(clock.remaining('black')).toBe(10 * 60_000 - 40_000);
    expect(clock.remaining('white')).toBe(10 * 60_000 - 30_000);
  });

  it('aplica o incremento ao lado que acabou de jogar', () => {
    let now = 100_000_000_000;
    const clock = new ChessClock('15+10', { now: () => now });
    clock.start();

    now += 20_000;
    clock.toggle();

    expect(clock.remaining('white')).toBe(900_000 - 20_000 + 10_000);
    expect(clock.getActiveSide()).toBe('black');
  });

  it('sem incremento não altera o saldo além do consumo', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    now += 60_000;
    clock.toggle();

    expect(clock.remaining('white')).toBe(10 * 60_000 - 60_000);
  });

  it('não alterna relógio parado', () => {
    const now = 100_000_000_000;
    const clock = clockWithTime(() => now);

    const result = clock.toggle();

    expect(result.justFlagged).toBe(false);
    expect(clock.getActiveSide()).toBeNull();
  });
});

describe('tempo nunca negativo e timeout', () => {
  it('esgota o tempo sem ficar negativo', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    now += 10 * 60_000;
    const result = clock.toggle();

    expect(result.justFlagged).toBe(true);
    expect(result.flagged).toBe('white');
    expect(clock.isFlagged('white')).toBe(true);
    expect(clock.isFinished()).toBe(true);
    expect(clock.isRunning()).toBe(false);
    expect(clock.getActiveSide()).toBeNull();
    expect(clock.remaining('white')).toBe(0);
    expect(clock.remaining('black')).toBe(10 * 60_000);
  });

  it('não consome mais após o flag', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    now += 10 * 60_000;
    clock.toggle();

    now += 60_000;
    const result = clock.toggle();

    expect(result.justFlagged).toBe(false);
    expect(clock.remaining('white')).toBe(0);
  });

  it('expire() declara timeout de um lado', () => {
    const now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    clock.expire('black');

    expect(clock.isFlagged('black')).toBe(true);
    expect(clock.isFinished()).toBe(true);
    expect(clock.isRunning()).toBe(false);
  });
});

describe('pausa e retomada', () => {
  it('pausa congela o tempo e a retomada prossegue', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    now += 10_000;
    clock.pause();

    expect(clock.isRunning()).toBe(false);
    expect(clock.remaining('white')).toBe(10 * 60_000 - 10_000);

    now += 60_000;
    expect(clock.remaining('white')).toBe(10 * 60_000 - 10_000);

    clock.resume();
    expect(clock.isRunning()).toBe(true);
    expect(clock.getActiveSide()).toBe('white');

    now += 5_000;
    clock.toggle();

    expect(clock.remaining('white')).toBe(10 * 60_000 - 10_000 - 5_000);
    expect(clock.getActiveSide()).toBe('black');
  });

  it('pausa e retomada alternam apenas quando aplicável', () => {
    const now = 100_000_000_000;
    const clock = clockWithTime(() => now);

    clock.pause();
    expect(clock.isRunning()).toBe(false);

    clock.resume();
    expect(clock.isRunning()).toBe(false);
  });
});

describe('restauração', () => {
  it('restaura o estado inicial do preset', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();
    now += 100_000;
    clock.toggle();
    now += 200_000;
    clock.toggle();

    clock.restore();

    expect(clock.getPreset()).toBe('10+0');
    expect(clock.remaining('white')).toBe(10 * 60_000);
    expect(clock.remaining('black')).toBe(10 * 60_000);
    expect(clock.getActiveSide()).toBeNull();
    expect(clock.isRunning()).toBe(false);
    expect(clock.isFinished()).toBe(false);
    expect(clock.isFlagged('white')).toBe(false);
  });

  it('restauração mantém o preset original', () => {
    const now = 100_000_000_000;
    const clock = new ChessClock('15+10', { now: () => now });

    clock.restore();

    expect(clock.getPreset()).toBe('15+10');
    expect(clock.getIncrementSeconds()).toBe(10);
    expect(clock.remaining('white')).toBe(15 * 60_000);
  });
});

describe('snapshot', () => {
  it('expõe um instantâneo consistente do estado', () => {
    const now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    const snap = clock.snapshot();

    expect(snap).toEqual({
      preset: '10+0',
      whiteMs: 10 * 60_000,
      blackMs: 10 * 60_000,
      incrementMs: 0,
      activeSide: 'white',
      running: true,
      flagged: null,
      finished: false,
    });
  });
});

describe('injeção de tempo nos testes', () => {
  it('permite controlar o tempo através de `now`', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();

    now += 1_000_000;
    expect(clock.remaining('white')).toBe(0);

    now += 9_000_000;
    expect(clock.remaining('white')).toBe(0);
  });
});

describe('load (instantâneo)', () => {
  it('carrega um instantâneo preservando saldos, lado ativo e estado de rodagem', () => {
    let now = 100_000_000_000;
    const clock = clockWithTime(() => now);
    clock.start();
    now += 30_000;
    clock.toggle();

    const snap = clock.snapshot();

    clock.pause();
    now += 60_000;
    clock.expire('black');

    clock.restoreFromSnapshot(snap);

    expect(clock.isRunning()).toBe(true);
    expect(clock.getActiveSide()).toBe('black');
    expect(clock.isFinished()).toBe(false);
    expect(clock.isFlagged('black')).toBe(false);
    expect(clock.remaining('white')).toBe(10 * 60_000 - 30_000);
    expect(clock.remaining('black')).toBe(10 * 60_000);
  });
});
