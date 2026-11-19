import { create } from 'zustand';

import {
  DEFAULT_APPEARANCE,
  type AppearanceSettings,
  type BackgroundId,
  type BoardThemeId,
} from '@/appearance/options';
import { applyAppearance, loadAppearance, saveAppearance } from '@/persistence/appearance';

type AppearanceState = AppearanceSettings & {
  setBackground: (background: BackgroundId) => void;
  setBoardTheme: (boardTheme: BoardThemeId) => void;
};

const persisted = loadAppearance();
const initial: AppearanceSettings = persisted ?? DEFAULT_APPEARANCE;

// Aplica antes do primeiro render para evitar "flash" da aparência padrão.
applyAppearance(initial);

function commit(settings: AppearanceSettings): void {
  saveAppearance(settings);
  applyAppearance(settings);
}

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  background: initial.background,
  boardTheme: initial.boardTheme,

  setBackground: (background: BackgroundId): void => {
    set({ background });
    commit({ background, boardTheme: get().boardTheme });
  },

  setBoardTheme: (boardTheme: BoardThemeId): void => {
    set({ boardTheme });
    commit({ background: get().background, boardTheme });
  },
}));
