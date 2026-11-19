import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScoreboardPanel } from '@/components/panels/ScoreboardPanel';
import { APPEARANCE_STORAGE_KEY } from '@/persistence/appearance';
import { GAME_STORAGE_KEY } from '@/persistence/game';
import { EMPTY_SCOREBOARD, loadScoreboard, SCOREBOARD_STORAGE_KEY } from '@/persistence/scoreboard';
import { useGameStore } from '@/store/game';
import { useScoreboardStore } from '@/store/scoreboard';

const REPETITION_MOVES = [
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
] as const;

beforeEach(() => {
  localStorage.clear();
  useScoreboardStore.setState({ ...EMPTY_SCOREBOARD, lastRecordedMatchId: null });
  useGameStore.getState().restart();
});

describe('Placar', () => {
  it('registra automaticamente a vitória das brancas', () => {
    useGameStore.getState().startGame('10+0');
    useGameStore.getState().playMove({ from: 'e2', to: 'e4' });
    useGameStore.getState().resign();

    const score = useScoreboardStore.getState();
    expect(score.whiteWins).toBe(1);
    expect(score.blackWins).toBe(0);
    expect(score.draws).toBe(0);
    expect(score.total).toBe(1);

    expect(loadScoreboard()).toMatchObject({
      whiteWins: 1,
      blackWins: 0,
      draws: 0,
    });
  });

  it('registra automaticamente a vitória das negras', () => {
    useGameStore.getState().startGame('10+0');
    useGameStore.getState().resign();

    const score = useScoreboardStore.getState();
    expect(score.whiteWins).toBe(0);
    expect(score.blackWins).toBe(1);
    expect(score.total).toBe(1);
  });

  it('registra automaticamente um empate', () => {
    useGameStore.getState().startGame('10+0');

    for (const move of REPETITION_MOVES) {
      useGameStore.getState().playMove(move);
    }

    expect(useGameStore.getState().status.claims).toContain('threefold-repetition');

    useGameStore.getState().claimDraw('threefold-repetition');

    const score = useScoreboardStore.getState();
    expect(score.draws).toBe(1);
    expect(score.whiteWins).toBe(0);
    expect(score.blackWins).toBe(0);
    expect(score.total).toBe(1);
  });

  it('não contabiliza a mesma partida duas vezes', () => {
    useGameStore.getState().startGame('10+0');
    useGameStore.getState().playMove({ from: 'e2', to: 'e4' });
    useGameStore.getState().resign();

    expect(useScoreboardStore.getState().total).toBe(1);

    // Mesmo resultado emitido novamente pelo mesmo motor.
    useGameStore.getState().resign();
    expect(useScoreboardStore.getState().total).toBe(1);

    // Desfazer o resultado e finalizar a mesma partida outra vez.
    expect(useGameStore.getState().undoMove()).not.toBeNull();
    useGameStore.getState().resign();

    const score = useScoreboardStore.getState();
    expect(score.whiteWins).toBe(1);
    expect(score.total).toBe(1);
  });

  it('contabiliza automaticamente um xeque-mate', () => {
    useGameStore.getState().startGame('10+0');

    const mate = [
      { from: 'f2', to: 'f3' },
      { from: 'e7', to: 'e5' },
      { from: 'g2', to: 'g4' },
      { from: 'd8', to: 'h4' },
    ] as const;

    for (const move of mate) {
      useGameStore.getState().playMove(move);
    }

    expect(useGameStore.getState().phase).toBe('finished');
    expect(useGameStore.getState().gameResult).toMatchObject({
      kind: 'checkmate',
      winner: 'b',
    });

    const score = useScoreboardStore.getState();
    expect(score.blackWins).toBe(1);
    expect(score.total).toBe(1);
  });

  it('contabiliza partidas diferentes separadamente', () => {
    useGameStore.getState().startGame('10+0');
    useGameStore.getState().resign(); // negras vencem

    useGameStore.getState().startGame('10+0');
    useGameStore.getState().resign(); // negras vencem novamente

    const score = useScoreboardStore.getState();
    expect(score.blackWins).toBe(2);
    expect(score.total).toBe(2);
  });

  it('exibe os valores atualizados do placar', () => {
    useScoreboardStore.setState({
      whiteWins: 3,
      blackWins: 2,
      draws: 1,
      total: 6,
    });

    render(<ScoreboardPanel />);

    expect(screen.getByText('Placar')).toBeInTheDocument();
    expect(screen.getByTestId('scoreboard-white')).toHaveTextContent('3');
    expect(screen.getByTestId('scoreboard-black')).toHaveTextContent('2');
    expect(screen.getByTestId('scoreboard-draws')).toHaveTextContent('1');
    expect(screen.getByTestId('scoreboard-total')).toHaveTextContent('6');
  });

  it('ignora um placar persistido inválido', () => {
    localStorage.setItem(SCOREBOARD_STORAGE_KEY, '{invalido');
    expect(loadScoreboard()).toBeNull();

    localStorage.setItem(
      SCOREBOARD_STORAGE_KEY,
      JSON.stringify({ version: 1, whiteWins: -1, blackWins: 0, draws: 0 }),
    );
    expect(loadScoreboard()).toBeNull();
  });

  it('usa uma chave independente e preserva partida e aparência', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, '{"version":1,"background":"bege"}');

    useGameStore.getState().startGame('10+0');
    useGameStore.getState().resign();

    const appearanceAfter = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    expect(localStorage.getItem(GAME_STORAGE_KEY)).not.toBeNull();
    expect(loadScoreboard()).toMatchObject({ whiteWins: 0, blackWins: 1, draws: 0 });

    // Reiniciar limpa a partida persistida, mas não o placar nem a aparência.
    useGameStore.getState().restart();
    expect(localStorage.getItem(GAME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe(appearanceAfter);
    expect(loadScoreboard()).toMatchObject({ whiteWins: 0, blackWins: 1, draws: 0 });
  });

  it('restaura o placar após recarregar sem duplicar a partida', async () => {
    useGameStore.getState().startGame('10+0');
    useGameStore.getState().playMove({ from: 'e2', to: 'e4' });
    useGameStore.getState().resign();

    expect(loadScoreboard()).not.toBeNull();

    vi.resetModules();
    const reloadedScoreboard = await import('@/store/scoreboard');
    const reloadedGame = await import('@/store/game');

    expect(reloadedScoreboard.useScoreboardStore.getState().whiteWins).toBe(1);
    expect(reloadedScoreboard.useScoreboardStore.getState().total).toBe(1);

    // A partida persistida volta como pausada; finalizá-la novamente não pode
    // contabilizar o mesmo resultado outra vez.
    expect(reloadedGame.useGameStore.getState().phase).toBe('paused');
    reloadedGame.useGameStore.getState().resign();

    expect(reloadedScoreboard.useScoreboardStore.getState().total).toBe(1);
    expect(reloadedScoreboard.useScoreboardStore.getState().whiteWins).toBe(1);
  });
});
