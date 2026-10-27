'use client';

import { useState } from 'react';
import type { SiteMode } from '@prisma/client';

export interface ModeToggleProps {
  currentMode: SiteMode;
  onModeChange: (newMode: SiteMode) => Promise<void>;
  disabled?: boolean;
}

const MODE_DESCRIPTIONS: Record<
  SiteMode,
  { title: string; subtitle: string; consequences: string[] }
> = {
  PRE: {
    title: 'Pre-Wedding Mode',
    subtitle: 'Standard anticipation phase before the wedding day.',
    consequences: [
      'RSVP form is active and open (subject to deadline).',
      'Hero displays "Join us" invitation copy with countdown timer.',
      'Only the "Pre-Wedding Moments" album is unlocked in the gallery.',
      'Guest uploads page is closed unless manually activated.',
    ],
  },
  LIVE: {
    title: 'Wedding Day Mode (LIVE)',
    subtitle: 'Active celebration mode on Saturday 19 December 2026.',
    consequences: [
      'Hero banner proclaims "Today!" with live stream link if set.',
      'Guest Moments album unlocks in the gallery.',
      'Guest photo uploads are active via QR link.',
      'RSVP remains accessible for last-minute guest lookups.',
    ],
  },
  POST: {
    title: 'Post-Wedding Mode',
    subtitle: 'After the celebration has concluded.',
    consequences: [
      'Hero displays heartfelt "Thank you" editorial copy.',
      'All photo albums (Pre-Wedding, Guest Moments, Wedding Day) unlock.',
      'RSVP closes with a warm concluding message and contacts.',
      'Uploads remain open until the close deadline.',
    ],
  },
};

export function ModeToggle({ currentMode, onModeChange, disabled = false }: ModeToggleProps) {
  const [selectedMode, setSelectedMode] = useState<SiteMode | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirm = async () => {
    if (!selectedMode || selectedMode === currentMode) return;
    setIsUpdating(true);
    try {
      await onModeChange(selectedMode);
      setSelectedMode(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 p-6 rounded-3xl bg-white border border-ink-100 shadow-xs">
      <div>
        <h2 className="text-lg font-serif font-bold text-magenta-950">Site Operation Mode</h2>
        <p className="text-xs text-ink-600 mt-0.5">
          Control the public experience across all pages, albums, and countdown states.
        </p>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-ivory-200 border border-ink-100">
        {(['PRE', 'LIVE', 'POST'] as const).map((mode) => {
          const isActive = currentMode === mode;
          return (
            <button
              key={mode}
              type="button"
              disabled={disabled || isUpdating}
              onClick={() => {
                if (mode !== currentMode) {
                  setSelectedMode(mode);
                }
              }}
              className={`min-h-[48px] py-2 px-3 rounded-xl font-serif text-sm font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                isActive
                  ? 'bg-magenta-900 text-white shadow-xs'
                  : 'text-ink-700 hover:text-ink-950 hover:bg-ivory-100/70'
              }`}
            >
              <span>{mode}</span>
              <span
                className={`text-[10px] font-sans font-normal ${isActive ? 'text-gold-300' : 'text-ink-500'}`}
              >
                {mode === 'PRE' ? 'Anticipation' : mode === 'LIVE' ? 'Wedding Day' : 'Memories'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode Summary Callout */}
      <div className="p-4 rounded-2xl bg-ivory-100/60 border border-gold-500/20 text-xs text-ink-600 space-y-1">
        <p className="font-semibold text-magenta-950">
          Current State: {MODE_DESCRIPTIONS[currentMode].title}
        </p>
        <p>{MODE_DESCRIPTIONS[currentMode].subtitle}</p>
      </div>

      {/* Confirmation Modal */}
      {selectedMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-switch-title"
          aria-describedby="mode-switch-description"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-4"
        >
          <div className="my-auto w-full min-w-0 max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border border-gold-500/30 bg-white p-5 shadow-2xl space-y-5 sm:max-h-[calc(100dvh-2rem)] sm:p-8 sm:space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-magenta-100 text-magenta-900">
                Mode Switch Confirmation
              </span>
              <h3 id="mode-switch-title" className="text-xl font-serif font-bold text-magenta-950">
                Switch site to {selectedMode} mode?
              </h3>
              <p id="mode-switch-description" className="text-xs text-ink-600">
                {MODE_DESCRIPTIONS[selectedMode].subtitle} Here is what will update immediately:
              </p>
            </div>

            <ul className="min-w-0 space-y-2 text-xs text-ink-700 bg-ivory-100/70 p-4 rounded-2xl border border-ink-100">
              {MODE_DESCRIPTIONS[selectedMode].consequences.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-magenta-800 font-bold">✓</span>
                  <span className="min-w-0 break-words">{c}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:pt-2">
              <button
                type="button"
                onClick={() => setSelectedMode(null)}
                disabled={isUpdating}
                className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-ivory-100 transition-colors cursor-pointer sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isUpdating}
                className="min-h-[44px] w-full px-6 py-2 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 sm:w-auto"
              >
                {isUpdating ? 'Updating Site...' : 'Confirm & Switch Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
