import { render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { useGameStore } from '@/store/game';

beforeEach(() => {
  vi.useFakeTimers();
  useGameStore.getState().restart();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('renderiza o jogo sem título no cabeçalho', () => {
    render(<App />);

    expect(screen.queryByText('Xadrez')).not.toBeInTheDocument();
  });

  it('inicia no estado aguardando início', () => {
    render(<App />);

    // O estado de espera é verificado pela presença do botão "Nova partida" habilitado
    const buttons = screen.getAllByRole('button', { name: 'Nova partida' });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).not.toBeDisabled();
  });

  it('exibe o botão Nova partida habilitado no estado waiting', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button', { name: 'Nova partida' });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).not.toBeDisabled();
  });

  it('exibe o tabuleiro de xadrez', () => {
    render(<App />);

    expect(screen.getByTestId('chessboard-board')).toBeInTheDocument();
  });
});