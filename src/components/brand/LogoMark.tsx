import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function LogoMark({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('size-8', className)}
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#16211b" />
      <rect x="8" y="8" width="8" height="8" rx="1.5" fill="#e9e5d8" />
      <rect x="16" y="16" width="8" height="8" rx="1.5" fill="#e9e5d8" />
      <rect x="16" y="8" width="8" height="8" rx="1.5" fill="#4b8a67" />
      <rect x="8" y="16" width="8" height="8" rx="1.5" fill="#4b8a67" />
    </svg>
  );
}
