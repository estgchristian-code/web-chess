/**
 * Catálogo de aparências disponíveis. Mantido separado do estado do jogo para
 * que nenhuma preferência visual interfira na partida.
 *
 * As cores aqui declaradas são usadas apenas nas prévias da interface; os
 * valores efetivos aplicados ao documento ficam em `styles/globals.css`.
 */

export const BACKGROUND_IDS = [
  'grafite',
  'preto',
  'cinza',
  'azul-escuro',
  'verde-escuro',
  'bege',
] as const;

export type BackgroundId = (typeof BACKGROUND_IDS)[number];

export type BackgroundOption = {
  id: BackgroundId;
  label: string;
  /** Cor representativa usada no seletor circular. */
  swatch: string;
  /** Indica que a paleta usa texto escuro (fundo claro). */
  light?: boolean;
};

export const BACKGROUND_OPTIONS: readonly BackgroundOption[] = [
  { id: 'grafite', label: 'Grafite', swatch: '#202020' },
  { id: 'preto', label: 'Preto', swatch: '#0b0b0c' },
  { id: 'cinza', label: 'Cinza', swatch: '#4b4b4b' },
  { id: 'azul-escuro', label: 'Azul-escuro', swatch: '#12202f' },
  { id: 'verde-escuro', label: 'Verde-escuro', swatch: '#10231b' },
  { id: 'bege', label: 'Bege', swatch: '#efe9dd', light: true },
];

export const BOARD_THEME_IDS = ['madeira', 'verde', 'azul', 'cinza', 'roxo', 'marrom'] as const;

export type BoardThemeId = (typeof BOARD_THEME_IDS)[number];

export type BoardThemeOption = {
  id: BoardThemeId;
  label: string;
  light: string;
  dark: string;
};

export const BOARD_THEME_OPTIONS: readonly BoardThemeOption[] = [
  { id: 'madeira', label: 'Madeira clássica', light: '#e9dcc3', dark: '#a77b56' },
  { id: 'verde', label: 'Verde clássico', light: '#eeeed2', dark: '#4f7a4a' },
  { id: 'azul', label: 'Azul', light: '#dbe7f3', dark: '#4a6f96' },
  { id: 'cinza', label: 'Cinza', light: '#d8d8d8', dark: '#6f6f6f' },
  { id: 'roxo', label: 'Roxo', light: '#e6dcf2', dark: '#6b4f8a' },
  { id: 'marrom', label: 'Marrom escuro', light: '#d9c3a5', dark: '#6b4a2f' },
];

export type AppearanceSettings = {
  background: BackgroundId;
  boardTheme: BoardThemeId;
};

/** A aparência atual do jogo é o padrão. */
export const DEFAULT_APPEARANCE: AppearanceSettings = {
  background: 'grafite',
  boardTheme: 'madeira',
};

export function isBackgroundId(value: unknown): value is BackgroundId {
  return typeof value === 'string' && (BACKGROUND_IDS as readonly string[]).includes(value);
}

export function isBoardThemeId(value: unknown): value is BoardThemeId {
  return typeof value === 'string' && (BOARD_THEME_IDS as readonly string[]).includes(value);
}
