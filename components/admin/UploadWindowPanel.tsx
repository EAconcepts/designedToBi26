'use client';

import { useState } from 'react';

export interface UploadWindowPanelProps {
  uploadsOpen: boolean;
  uploadsCloseAt: string | null;
  uploadUrl: string | null;
  onUpdateWindow: (updates: {
    uploadsOpen?: boolean;
    uploadsCloseAt?: string | null;
  }) => Promise<void>;
}

export function UploadWindowPanel({
  uploadsOpen,
  uploadsCloseAt,
  uploadUrl,
  onUpdateWindow,
}: UploadWindowPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!uploadUrl) return;
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 p-6 rounded-3xl bg-white border border-ink-100 shadow-xs">
      <div>
        <h2 className="text-lg font-serif font-bold text-magenta-950">Guest Photo Uploads</h2>
        <p className="text-xs text-ink-600 mt-0.5">
          Manage photo upload availability and share the upload link with guests.
        </p>
      </div>

      {/* Uploads Window Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ivory-100/60 border border-ink-100">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink-900">Upload Availability</p>
          <p className="text-xs text-ink-600">
            {uploadsOpen
              ? 'Active: Guests can upload photographs using the upload link.'
              : 'Closed: Guests opening the upload link will see an inactive message.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onUpdateWindow({ uploadsOpen: !uploadsOpen })}
          className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            uploadsOpen
              ? 'bg-green-700 hover:bg-green-800 text-white shadow-xs'
              : 'bg-ink-200 hover:bg-ink-300 text-ink-800'
          }`}
        >
          {uploadsOpen ? 'Uploads are OPEN' : 'Uploads are CLOSED'}
        </button>
      </div>

      {/* Deadline Picker */}
      <div className="space-y-2">
        <label htmlFor="upload-close-at" className="block text-xs font-semibold text-ink-800">
          Uploads Auto-Close Date/Time (Optional):
        </label>
        <input
          id="upload-close-at"
          type="datetime-local"
          defaultValue={uploadsCloseAt ? uploadsCloseAt.slice(0, 16) : ''}
          onChange={(e) => {
            const val = e.target.value ? new Date(e.target.value).toISOString() : null;
            onUpdateWindow({ uploadsCloseAt: val });
          }}
          className="text-xs px-3 py-2 rounded-xl border border-ink-200 bg-ivory-50/50 text-ink-900"
        />
        <p className="text-[11px] text-ink-500">
          If left empty, uploads remain open according to the toggle state.
        </p>
      </div>

      <div className="max-w-2xl space-y-2">
        <label htmlFor="guest-upload-url" className="block text-xs font-semibold text-ink-800">
          Guest Photo Upload Link:
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            id="guest-upload-url"
            type="text"
            readOnly
            value={uploadUrl || 'Not configured'}
            className="w-full min-w-0 flex-1 text-xs px-3 py-2 rounded-xl border border-ink-200 bg-white text-ink-700"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!uploadUrl}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-ink-200 text-xs font-semibold hover:bg-ivory-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {copied ? 'Copied! ✓' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
}
