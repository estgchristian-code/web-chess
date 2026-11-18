import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'muted';

type BadgeProps = ComponentProps<'span'> & {
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  neutral: 'border-line-strong bg-surface text-ink-soft',
  accent: 'border-accent/20 bg-accent-soft text-accent-strong',
  muted: 'border-transparent bg-surface-muted text-ink-muted',
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide uppercase',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
