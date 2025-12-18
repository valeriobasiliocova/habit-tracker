import { Outlet, Link } from 'react-router-dom';
import { Command } from 'lucide-react';

import { GlobalNav } from './GlobalNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="h-16 flex items-center justify-between px-4 sm:px-8 max-w-[2400px] mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <Command className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
            <span className="font-display font-bold text-base sm:text-lg tracking-tight group-hover:text-primary transition-colors">
              Mattioli.OS
            </span>
          </Link>

          <GlobalNav />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
