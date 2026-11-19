import type { ReactNode } from 'react';

import { LogoMark } from '@/components/brand/LogoMark';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line/80 bg-canvas/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
            <span className="hidden text-xs font-medium text-ink-muted sm:block">jogo local</span>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-5 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        </div>
      </footer>
    </>
  );
}
