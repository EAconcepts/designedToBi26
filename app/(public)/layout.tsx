import type { ReactNode } from 'react';
import { PublicNav, PublicFooter } from '@/components/brand';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-ink">
      <PublicNav />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
