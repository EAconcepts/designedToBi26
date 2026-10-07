'use client';

import { useState } from 'react';

export interface CopyFieldProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyField({ value, label, className = '' }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch {
      // Fall through to fallback
    }

    try {
      const el = document.createElement('textarea');
      el.value = value;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch {
      // Ignore
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-xs text-ink-500 font-medium uppercase tracking-wider">{label}</p>
        )}
        <p className="font-mono text-sm sm:text-base font-bold text-ink-900 truncate tracking-wide">
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? `Copied ${label || value}` : `Copy ${label || value}`}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer min-h-[36px] flex items-center gap-1.5 select-none ${
          copied
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-white hover:bg-gold-50 text-gold-800 border border-gold-300 hover:border-gold-500 shadow-xs'
        }`}
      >
        <span>{copied ? '✓' : '📋'}</span>
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>

      {/* Screen reader announcement */}
      <span className="sr-only" aria-live="polite">
        {copied ? `Copied ${label || value} to clipboard` : ''}
      </span>
    </div>
  );
}
