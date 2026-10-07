import { z } from 'zod';
import { positiveIntMinor } from '@/lib/validation/common';

export const GiftInitInput = z.object({
  fundSlug: z.string().min(1, 'Fund is required').max(40, 'Fund slug too long'),
  amountMinor: positiveIntMinor,
  giverName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  giverEmail: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(160, 'Email cannot exceed 160 characters'),
  message: z.string().trim().max(300, 'Message cannot exceed 300 characters').optional(),
  isAnonymous: z.boolean().default(false),
});

export type GiftInitInput = z.infer<typeof GiftInitInput>;

export const BankTransferDeclareInput = z.object({
  fundSlug: z.string().min(1).max(40).optional(),
  amountMinor: positiveIntMinor.optional(),
  giverName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  giverEmail: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(160, 'Email cannot exceed 160 characters')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().max(300, 'Message cannot exceed 300 characters').optional(),
  isAnonymous: z.boolean().default(false),
});

export type BankTransferDeclareInput = z.infer<typeof BankTransferDeclareInput>;
