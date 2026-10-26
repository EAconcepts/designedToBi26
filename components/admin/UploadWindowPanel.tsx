'use client';

import { useState } from 'react';

export interface UploadWindowPanelProps {
  uploadsOpen: boolean;
  uploadsCloseAt: string | null;
  uploadUrl: string | null;
  uploadQrSvg: string | null;
  onUpdateWindow: (updates: {
    uploadsOpen?: boolean;
    uploadsCloseAt?: string | null;
  }) => Promise<void>;
}

export function UploadWindowPanel({
  uploadsOpen,
  uploadsCloseAt,
  uploadUrl,
  uploadQrSvg,
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-6 rounded-3xl bg-white border border-ink-100 shadow-xs">
      {/* Print only tent card styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-card,
          #printable-qr-card * {
            visibility: visible;
          }
          #printable-qr-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 400px;
            display: block !important;
          }
        }
      `}</style>

      <div>
        <h2 className="text-lg font-serif font-bold text-magenta-950">
          Guest Photo Uploads & Table QR
        </h2>
        <p className="text-xs text-ink-600 mt-0.5">
          Manage upload availability and table QR cards.
        </p>
      </div>

      {/* Uploads Window Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ivory-100/60 border border-ink-100">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink-900">Upload Availability</p>
          <p className="text-xs text-ink-600">
            {uploadsOpen
              ? 'Active: Guests can upload photographs via the QR link.'
              : 'Closed: Guests scanning the QR will see an inactive message.'}
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

      {/* QR Code and Actions */}
      <div className="p-5 rounded-2xl border border-gold-500/20 bg-ivory-50/40 flex flex-col md:flex-row items-center gap-6">
        {/* Printable Card Area */}
        <div
          id="printable-qr-card"
          className="p-6 rounded-2xl bg-white border border-gold-500/30 text-center shadow-xs space-y-3 shrink-0"
        >
          <p className="font-serif font-bold text-lg text-magenta-950">A & E</p>
          <div className="w-44 h-44 mx-auto flex items-center justify-center bg-ivory-100 rounded-xl overflow-hidden p-2">
            {uploadQrSvg ? (
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: uploadQrSvg }}
              />
            ) : (
              <p className="text-xs text-ink-400">No token generated</p>
            )}
          </div>
          <p className="text-[11px] font-serif italic text-magenta-900">#designedToBi&apos;26</p>
          <p className="text-[10px] text-ink-500 tracking-wider">Scan to share your memories</p>
        </div>

        {/* Link & Control Actions */}
        <div className="flex-1 space-y-4 w-full">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-800">Current Table Upload URL:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadUrl || 'Not configured'}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-ink-200 bg-white text-ink-700 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!uploadUrl}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-ink-200 text-xs font-semibold hover:bg-ivory-100 transition-colors cursor-pointer"
              >
                {copied ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!uploadQrSvg}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              Print Table QR Card 🖨️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
