import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-ink-900">
      <header className="border-b border-gold-500/20 bg-white px-6 py-4 flex items-center justify-between">
        <div className="font-semibold text-lg tracking-wide">
          Wedding Admin <span className="text-xs text-ink-600 font-normal">(Shell)</span>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
