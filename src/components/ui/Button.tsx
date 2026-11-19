import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium ' +
  'select-none transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-canvas active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-control hover:bg-accent-strong hover:shadow-lift ' +
    'disabled:bg-surface-sunken disabled:text-ink-muted disabled:shadow-none',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ' +
    'hover:border-ink-muted/40 hover:bg-surface-muted disabled:opacity-50 disabled:shadow-none',
  ghost:
    'text-ink-soft hover:bg-surface-muted hover:text-ink disabled:opacity-50 disabled:hover:bg-transparent',
  danger:
    'border border-danger/45 bg-danger-soft/40 text-danger hover:border-danger/70 hover:bg-danger-soft ' +
    'disabled:opacity-50 disabled:hover:bg-danger-soft/40',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[0.9375rem]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
