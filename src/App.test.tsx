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
  it('renderiza o jogo com o título principal', () => {
    render(<App />);

    expect(screen.getAllByText('Xadrez')).toHaveLength(2);
  });

  it('inicia no estado aguardando início', () => {
    render(<App />);

    expect(screen.getByText('Aguardando início')).toBeInTheDocument();
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