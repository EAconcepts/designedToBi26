/**
 * Money utilities for Nigerian Naira (NGN).
 * Currency is stored as integer kobo (minor units) throughout the database.
 */

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

export function formatNGN(amountMinor: number, opts?: { compact?: boolean }): string {
  const major = amountMinor / 100;
  if (opts?.compact && Math.abs(major) >= 1000) {
    const formatter = new Intl.NumberFormat('en-NG', {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return `₦${formatter.format(major)}`;
  }

  const hasKobo = amountMinor % 100 !== 0;
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(major);

  return `₦${formatted}`;
}
