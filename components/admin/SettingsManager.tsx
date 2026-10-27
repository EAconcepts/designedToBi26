'use client';

import { useState, useEffect } from 'react';
import type { SiteMode, Setting } from '@prisma/client';
import { ModeToggle } from './ModeToggle';
import { UploadWindowPanel } from './UploadWindowPanel';

export type SettingsWithUploadLink = Setting & {
  uploadUrl: string | null;
};

export function SettingsManager() {
  const [settings, setSettings] = useState<SettingsWithUploadLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rsvpDate, setRsvpDate] = useState<string>('');
  const [liveStream, setLiveStream] = useState<string>('');

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok && !ignore) {
          const json = await res.json();
          setSettings(json.data);
          if (json.data.rsvpDeadline) {
            setRsvpDate(new Date(json.data.rsvpDeadline).toISOString().slice(0, 10));
          }
          if (json.data.liveStreamUrl) {
            setLiveStream(json.data.liveStreamUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdate = async (
    patch: Partial<{
      mode: SiteMode;
      rsvpDeadline: string | null;
      uploadsOpen: boolean;
      uploadsCloseAt: string | null;
      liveStreamUrl: string | null;
    }>,
  ) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      if (res.ok) {
        const json = await res.json();
        setSettings((prev) => (prev ? { ...prev, ...json.data } : null));
        showToast('Site settings updated — changes reflected across all surfaces.');
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson?.error?.message || 'Failed to update settings.');
      }
    } catch {
      showToast('Network error while saving settings.');
    }
  };

  if (isLoading || !settings) {
    return <div className="py-20 text-center text-ink-500 text-sm">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-magenta-950">
          Settings & Mode Control
        </h1>
        <p className="text-xs sm:text-sm text-ink-600 mt-1">
          Manage operational site phase transitions, RSVP deadlines, and live event features.
        </p>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-xs font-medium flex items-center justify-between">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-green-700">
            ✕
          </button>
        </div>
      )}

      {/* 1. Mode Control */}
      <ModeToggle
        currentMode={settings.mode}
        onModeChange={async (newMode) => {
          await handleUpdate({ mode: newMode });
        }}
      />

      {/* 2. RSVP Deadline & Live Stream Settings */}
      <div className="min-w-0 p-6 rounded-3xl bg-white border border-ink-100 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-serif font-bold text-magenta-950">
            RSVP & Ceremony Broadcast
          </h2>
          <p className="text-xs text-ink-600 mt-0.5">
            Configure response cut-off dates and virtual streaming links for remote guests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deadline field */}
          <div className="space-y-2">
            <label
              htmlFor="rsvp-deadline-input"
              className="block text-xs font-semibold text-ink-800"
            >
              RSVP Deadline Date (WAT):
            </label>
            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
              <input
                id="rsvp-deadline-input"
                type="date"
                value={rsvpDate}
                onChange={(e) => setRsvpDate(e.target.value)}
                className="w-full min-w-0 flex-1 text-xs px-3 py-2 rounded-xl border border-ink-200 bg-ivory-50/50 text-ink-900"
              />
              <button
                type="button"
                onClick={() => handleUpdate({ rsvpDeadline: rsvpDate || null })}
                className="min-h-[40px] w-full px-4 py-2 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold transition-colors cursor-pointer lg:w-auto"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-ink-500">
              Evaluated at 23:59:59 WAT (West Africa Time, UTC+1) on the chosen date.
            </p>
          </div>

          {/* Live stream URL field */}
          <div className="space-y-2">
            <label htmlFor="live-stream-input" className="block text-xs font-semibold text-ink-800">
              Live Stream Broadcast URL (HTTPS):
            </label>
            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
              <input
                id="live-stream-input"
                type="url"
                placeholder="https://youtube.com/live/..."
                value={liveStream}
                onChange={(e) => setLiveStream(e.target.value)}
                className="w-full min-w-0 flex-1 text-xs px-3 py-2 rounded-xl border border-ink-200 bg-ivory-50/50 text-ink-900 placeholder:text-ink-400"
              />
              <button
                type="button"
                onClick={() => handleUpdate({ liveStreamUrl: liveStream.trim() || null })}
                className="min-h-[40px] w-full px-4 py-2 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold transition-colors cursor-pointer lg:w-auto"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-ink-500">
              Displays a live stream banner on the homepage exclusively during LIVE mode.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Guest Photo Upload Window */}
      <UploadWindowPanel
        uploadsOpen={settings.uploadsOpen}
        uploadsCloseAt={
          settings.uploadsCloseAt ? new Date(settings.uploadsCloseAt).toISOString() : null
        }
        uploadUrl={settings.uploadUrl}
        onUpdateWindow={async (updates) => {
          await handleUpdate(updates);
        }}
      />
    </div>
  );
}
