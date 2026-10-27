'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
};

export function AdminMobileNav({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={isOpen ? 'Close admin menu' : 'Open admin menu'}
        aria-expanded={isOpen}
        aria-controls="admin-mobile-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 transition-colors hover:border-gold-500/50 hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-5 w-5 text-magenta-900"
        >
          {isOpen ? (
            <path
              d="m5 5 10 10M15 5 5 15"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M3 5.5h14M3 10h14M3 14.5h14"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          )}
        </svg>
        Menu
      </button>

      <div
        className={`fixed inset-0 z-[60] transition-[visibility] duration-300 md:hidden ${
          isOpen ? 'visible' : 'invisible'
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close admin menu"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 h-full w-full bg-ink-900/35 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          id="admin-mobile-menu"
          className={`absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col border-l border-gold-500/30 bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gold-500/20 px-5 py-5">
            <p className="font-serif text-lg font-bold text-magenta-900">Admin menu</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-ink-700 transition-colors hover:bg-ivory-100 hover:text-magenta-900 focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2"
              aria-label="Close admin menu"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path
                  d="m5 5 10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <nav aria-label="Admin navigation" className="overflow-y-auto p-4">
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-magenta-900 !text-white'
                          : 'text-ink-700 hover:bg-ivory-100 hover:text-magenta-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
