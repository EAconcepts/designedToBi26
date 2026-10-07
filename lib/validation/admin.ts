import { z } from 'zod';
import { emailSchema, phoneSchema } from '@/lib/validation/common';

export const SideSchema = z.enum(['PARTNER_A', 'PARTNER_B', 'BOTH']);

export const CreateGuestInput = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name cannot exceed 100 characters'),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  side: SideSchema.default('BOTH'),
  maxPartySize: z.number().int().min(1).max(10).default(1),
  eventSlugs: z.array(z.string().min(1).max(40)).min(1, 'At least one event must be selected'),
});

export type CreateGuestInput = z.infer<typeof CreateGuestInput>;

export const UpdateGuestInput = CreateGuestInput.partial();
export type UpdateGuestInput = z.infer<typeof UpdateGuestInput>;

export const AdminRsvpQueryInput = z.object({
  status: z.enum(['PENDING', 'ATTENDING', 'DECLINED']).optional(),
  q: z.string().trim().optional(),
  nonResponders: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),
});

export type AdminRsvpQueryInput = z.infer<typeof AdminRsvpQueryInput>;

export const AdminGuestQueryInput = z.object({
  q: z.string().trim().optional(),
  side: SideSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type AdminGuestQueryInput = z.infer<typeof AdminGuestQueryInput>;

export const AdminUpdateGiftInput = z.object({
  status: z.enum(['SUCCESS', 'ABANDONED']),
});

export type AdminUpdateGiftInput = z.infer<typeof AdminUpdateGiftInput>;

export const AdminGiftQueryInput = z.object({
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'ABANDONED']).optional(),
  fund: z.string().trim().optional(),
  channel: z.enum(['PAYSTACK', 'BANK_TRANSFER_DECLARED']).optional(),
  q: z.string().trim().optional(),
});

export type AdminGiftQueryInput = z.infer<typeof AdminGiftQueryInput>;
