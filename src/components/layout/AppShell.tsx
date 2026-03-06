'use client';

import { StepWizard } from './StepWizard';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-kn-blue to-kn-navy px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-5">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src="/kubenest-logo.svg"
              alt="KubeNest"
              width={140}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-white/25 sm:block" />

          {/* Title block */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight text-white sm:text-xl">
              Master Data Tool
            </h1>
            <p className="text-xs font-medium tracking-wide text-white/70 sm:text-sm">
              Data Preparation &amp; Cleanse
            </p>
          </div>
        </div>
      </header>

      {/* ── Step Wizard ── */}
      <StepWizard />

      {/* ── Main Content ── */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
