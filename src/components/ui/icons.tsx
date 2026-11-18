import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

type IconProps = ComponentProps<'svg'>;

const base = 'size-5 shrink-0';

function IconBase({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn(base, className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconRules({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path d="M12 3.5 5 6.2v5.1c0 4.2 2.9 7.6 7 9.2 4.1-1.6 7-5 7-9.2V6.2L12 3.5Z" />
      <path d="m9.2 11.6 2 2.1 3.6-4" />
    </IconBase>
  );
}

export function IconClock({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </IconBase>
  );
}

export function IconDevice({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <rect x="3.5" y="5" width="13" height="10" rx="1.8" />
      <path d="M7.5 19h6" />
      <path d="M10.5 15v4" />
      <rect x="16.5" y="9" width="4" height="10" rx="1.4" />
    </IconBase>
  );
}

export function IconArrowRight({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path d="M4.5 12h15" />
      <path d="m14 6.5 5.5 5.5L14 17.5" />
    </IconBase>
  );
}

export function IconPause({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </IconBase>
  );
}

export function IconPlay({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <polygon points="5 3 19 12 5 21" />
    </IconBase>
  );
}

export function IconRotateCcw({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </IconBase>
  );
}

export function IconX({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
  );
}

export function IconFlag({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </IconBase>
  );
}
