import { isBackgroundId, isBoardThemeId, type AppearanceSettings } from '@/appearance/options';

export const APPEARANCE_STORAGE_VERSION = 1;

/** Chave própria: as preferências visuais nunca tocam no estado da partida. */
export const APPEARANCE_STORAGE_KEY = 'chess-appearance-v1';

type PersistedAppearance = AppearanceSettings & { version: typeof APPEARANCE_STORAGE_VERSION };

/** Grava as preferências. Erros de armazenamento são ignorados silenciosamente. */
export function saveAppearance(settings: AppearanceSettings): void {
  try {
    const data: PersistedAppearance = {
      version: APPEARANCE_STORAGE_VERSION,
      background: settings.background,
      boardTheme: settings.boardTheme,
    };
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota excedida, modo privado, etc.: a interface continua funcionando.
  }
}

/**
 * Lê e valida as preferências persistidas. Retorna null quando não há dado,
 * o conteúdo é inválido ou ocorre qualquer erro de leitura.
 */
export function loadAppearance(): AppearanceSettings | null {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (candidate.version !== APPEARANCE_STORAGE_VERSION) {
      return null;
    }

    if (!isBackgroundId(candidate.background) || !isBoardThemeId(candidate.boardTheme)) {
      return null;
    }

    return {
      background: candidate.background,
      boardTheme: candidate.boardTheme,
    };
  } catch {
    return null;
  }
}

/**
 * Aplica a aparência no `<html>` via atributos `data-*`. As paletas e os temas
 * de tabuleiro correspondentes vivem em `styles/globals.css`.
 */
export function applyAppearance(settings: AppearanceSettings): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.background = settings.background;
  root.dataset.boardTheme = settings.boardTheme;
}
