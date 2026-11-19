import type { ReactNode } from 'react';

import { LogoMark } from '@/components/brand/LogoMark';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-5 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
            <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
            <span className="hidden items-center gap-1.5 rounded-full border border-line/70 bg-surface/60 px-2.5 py-1 text-[0.625rem] font-medium tracking-[0.14em] text-ink-muted uppercase sm:inline-flex">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent/80" />
              jogo local
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line/70" />
    </>
  );
}
