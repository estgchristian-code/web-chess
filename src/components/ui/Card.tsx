import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line/80 bg-surface shadow-card transition-colors duration-200',
        className,
      )}
      {...props}
    />
  );
}
