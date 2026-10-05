import { z } from 'zod';
import { CODE_ALPHABET } from '@/lib/codes';

export function trimmedString(min: number = 1, max: number = 255) {
  return z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(min, `Must be at least ${min} character${min === 1 ? '' : 's'}`)
        .max(max, `Must be at most ${max} character${max === 1 ? '' : 's'}`),
    );
}

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must consist of lowercase alphanumeric words separated by single hyphens',
  );

export const positiveIntMinor = z
  .number()
  .int('Amount in kobo must be an integer')
  .positive('Amount in kobo must be positive');

export const guestCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .length(8, 'Guest code must be exactly 8 characters')
  .refine(
    (code) => {
      for (const ch of code) {
        if (!CODE_ALPHABET.includes(ch)) return false;
      }
      return true;
    },
    { message: 'Guest code contains invalid characters' },
  );

export const emailSchema = z.string().trim().toLowerCase().email('Invalid email address');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+0-9\s\-()]{7,25}$/, 'Invalid phone number format');
