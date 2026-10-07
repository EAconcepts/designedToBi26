'use client';

import { useSyncExternalStore } from 'react';
import type { SiteMode } from '@prisma/client';

export interface LiveBannerProps {
  mode: SiteMode;
  liveStreamUrl?: string | null;
}

const STORAGE_KEY = 'wedding_live_banner_dismissed';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  if (typeof window === 'undefined') return true;
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot() {
  return true;
}

export function LiveBanner({ mode, liveStreamUrl }: LiveBannerProps) {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (mode !== 'LIVE' || !liveStreamUrl || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <aside
      data-testid="live-banner"
      aria-label="Live Wedding Broadcast"
      className="sticky top-0 z-40 bg-gradient-to-r from-magenta-950 via-magenta-900 to-ink-950 text-white px-4 py-2.5 sm:py-3 shadow-md border-b border-gold-500/40"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative flex-shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <div className="text-xs sm:text-sm font-medium">
            <span className="font-bold text-gold-300 uppercase tracking-wider text-[11px] mr-1.5">
              Live Broadcast:
            </span>
            <span>Our wedding celebration is streaming live right now!</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold-500 hover:bg-gold-400 text-magenta-950 text-xs font-bold transition-transform hover:scale-105 shadow-sm"
          >
            <span>Watch Live Stream</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss live stream notification"
            className="text-ink-300 hover:text-white p-1 rounded transition-colors text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      </div>
    </aside>
  );
}
