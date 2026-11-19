import {
  BACKGROUND_OPTIONS,
  BOARD_THEME_OPTIONS,
  type BackgroundOption,
  type BoardThemeOption,
} from '@/appearance/options';
import { Card } from '@/components/ui/Card';
import { IconPalette } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { useAppearanceStore } from '@/store/appearance';

function tileClass(selected: boolean): string {
  return cn(
    'flex min-w-0 items-center gap-2 rounded-xl border px-2 py-1.5 text-left',
    'transition-[background-color,border-color,box-shadow] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    selected
      ? 'border-accent/55 bg-accent-soft/35 text-ink shadow-[0_8px_18px_-14px_rgba(0,0,0,0.9)]'
      : 'border-line/60 bg-surface-muted/20 text-ink-soft hover:border-line-strong hover:bg-surface-muted/50 hover:text-ink',
  );
}

function BackgroundTile({
  option,
  selected,
  onSelect,
}: {
  option: BackgroundOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Fundo ${option.label}`}
      title={`Fundo ${option.label}`}
      data-testid={`background-${option.id}`}
      onClick={onSelect}
      className={tileClass(selected)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-5 shrink-0 rounded-full border border-white/15',
          'shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.5)]',
          selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
        )}
        style={{ backgroundColor: option.swatch }}
      />
      <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-medium">{option.label}</span>
    </button>
  );
}

function BoardThemeTile({
  option,
  selected,
  onSelect,
}: {
  option: BoardThemeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Tema ${option.label}`}
      title={`Tema ${option.label}`}
      data-testid={`board-theme-${option.id}`}
      onClick={onSelect}
      className={tileClass(selected)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-6 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-[5px] border border-black/20',
          selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
        )}
      >
        <span style={{ backgroundColor: option.light }} />
        <span style={{ backgroundColor: option.dark }} />
        <span style={{ backgroundColor: option.dark }} />
        <span style={{ backgroundColor: option.light }} />
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-[0.625rem] leading-tight font-medium">
        {option.label}
      </span>
    </button>
  );
}

export function AppearancePanel() {
  const background = useAppearanceStore((state) => state.background);
  const boardTheme = useAppearanceStore((state) => state.boardTheme);
  const setBackground = useAppearanceStore((state) => state.setBackground);
  const setBoardTheme = useAppearanceStore((state) => state.setBoardTheme);

  return (
    <Card className="p-4" data-testid="appearance-panel">
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-6 shrink-0 place-items-center rounded-md border border-line/70 bg-surface-muted/60 text-ink-muted"
        >
          <IconPalette className="size-3.5" />
        </span>
        <h3 className="text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-muted uppercase">
          Aparência
        </h3>
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-[0.625rem] font-medium tracking-[0.12em] text-ink-muted/80 uppercase">
          Fundo do jogo
        </legend>
        <div className="grid grid-cols-2 gap-1.5">
          {BACKGROUND_OPTIONS.map((option) => (
            <BackgroundTile
              key={option.id}
              option={option}
              selected={option.id === background}
              onSelect={() => setBackground(option.id)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3 min-w-0">
        <legend className="mb-2 text-[0.625rem] font-medium tracking-[0.12em] text-ink-muted/80 uppercase">
          Tabuleiro
        </legend>
        <div className="grid grid-cols-2 gap-1.5">
          {BOARD_THEME_OPTIONS.map((option) => (
            <BoardThemeTile
              key={option.id}
              option={option}
              selected={option.id === boardTheme}
              onSelect={() => setBoardTheme(option.id)}
            />
          ))}
        </div>
      </fieldset>
    </Card>
  );
}
