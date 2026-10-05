import { customAlphabet } from 'nanoid';

/**
 * 31-character alphabet without ambiguous characters:
 * No 0/O, 1/I/l to prevent confusion when spoken or typed.
 */
export const CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export const newGuestCode = customAlphabet(CODE_ALPHABET, 8);

export function normalizeGuestCode(code: string): string {
  return code.trim().toLowerCase();
}

export function isValidGuestCode(code: string): boolean {
  if (code.length !== 8) return false;
  const normalized = normalizeGuestCode(code);
  for (const ch of normalized) {
    if (!CODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}
