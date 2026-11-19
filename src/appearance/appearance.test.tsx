import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { DEFAULT_APPEARANCE } from '@/appearance/options';
import { APPEARANCE_STORAGE_KEY, loadAppearance } from '@/persistence/appearance';
import { GAME_STORAGE_KEY } from '@/persistence/game';
import { useAppearanceStore } from '@/store/appearance';
import { useGameStore } from '@/store/game';

function resetAppearance(): void {
  useAppearanceStore.getState().setBackground(DEFAULT_APPEARANCE.background);
  useAppearanceStore.getState().setBoardTheme(DEFAULT_APPEARANCE.boardTheme);
}

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().restart();
  resetAppearance();
});

afterEach(() => {
  localStorage.clear();
});

describe('Personalização visual', () => {
  it('exibe as seis opções de fundo e os seis temas de tabuleiro', () => {
    render(<App />);

    expect(screen.getAllByRole('button', { name: /^Fundo / })).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: /^Tema / })).toHaveLength(6);
    expect(screen.getByTestId('appearance-panel')).toBeInTheDocument();
  });

  it('aplica fundo e tabuleiro imediatamente e de forma independente', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Fundo Bege' }));

    expect(useAppearanceStore.getState().background).toBe('bege');
    expect(document.documentElement.dataset.background).toBe('bege');
    expect(document.documentElement.dataset.boardTheme).toBe('madeira');
    expect(screen.getByRole('button', { name: 'Fundo Bege' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Tema Roxo' }));

    expect(useAppearanceStore.getState().boardTheme).toBe('roxo');
    expect(document.documentElement.dataset.boardTheme).toBe('roxo');
    // O fundo escolhido permanece intacto ao trocar o tabuleiro.
    expect(document.documentElement.dataset.background).toBe('bege');
    expect(screen.getByRole('button', { name: 'Tema Roxo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Tema Azul' }));

    expect(document.documentElement.dataset.boardTheme).toBe('azul');
    expect(document.documentElement.dataset.background).toBe('bege');
  });

  it('salva as preferências no localStorage em uma chave separada da partida', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Fundo Azul-escuro' }));
    await user.click(screen.getByRole('button', { name: 'Tema Verde clássico' }));

    expect(loadAppearance()).toEqual({
      background: 'azul-escuro',
      boardTheme: 'verde',
    });

    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    expect(raw).toContain('"background":"azul-escuro"');
    expect(raw).toContain('"boardTheme":"verde"');
  });

  it('aplica a aparência durante uma partida sem alterar o estado do jogo', async () => {
    const user = userEvent.setup();

    useGameStore.getState().startGame('10+0');
    useGameStore.getState().playMove({ from: 'e2', to: 'e4' });

    const before = useGameStore.getState();
    const fen = before.engine.fen();
    const historyLength = before.history.length;
    const phase = before.phase;

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Fundo Verde-escuro' }));
    await user.click(screen.getByRole('button', { name: 'Tema Marrom escuro' }));

    const after = useGameStore.getState();
    expect(after.engine.fen()).toBe(fen);
    expect(after.history).toHaveLength(historyLength);
    expect(after.phase).toBe(phase);
    expect(document.documentElement.dataset.background).toBe('verde-escuro');
    expect(document.documentElement.dataset.boardTheme).toBe('marrom');
    expect(screen.getByTestId('chessboard-board')).toBeInTheDocument();
  });

  it('não sobrescreve os dados persistidos da partida', async () => {
    const user = userEvent.setup();

    useGameStore.getState().startGame('5+0');
    const gameBefore = localStorage.getItem(GAME_STORAGE_KEY);
    expect(gameBefore).not.toBeNull();

    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fundo Preto' }));

    expect(localStorage.getItem(GAME_STORAGE_KEY)).toBe(gameBefore);
  });

  it('restaura as preferências após recarregar a página', async () => {
    useAppearanceStore.getState().setBackground('azul-escuro');
    useAppearanceStore.getState().setBoardTheme('verde');

    vi.resetModules();
    const reloaded = await import('@/store/appearance');

    expect(reloaded.useAppearanceStore.getState().background).toBe('azul-escuro');
    expect(reloaded.useAppearanceStore.getState().boardTheme).toBe('verde');
    expect(document.documentElement.dataset.background).toBe('azul-escuro');
    expect(document.documentElement.dataset.boardTheme).toBe('verde');
  });

  it('ignora preferências inválidas e mantém a aparência padrão', () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ version: 1, background: 'neon', boardTheme: 'madeira' }),
    );

    expect(loadAppearance()).toBeNull();

    localStorage.setItem(APPEARANCE_STORAGE_KEY, '{conteudo-invalido');
    expect(loadAppearance()).toBeNull();

    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ version: 99, background: 'bege', boardTheme: 'azul' }),
    );
    expect(loadAppearance()).toBeNull();
  });
});
