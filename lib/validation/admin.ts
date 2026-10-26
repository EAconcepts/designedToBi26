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

export const AdminMediaQueryInput = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional().default('PENDING'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});
export type AdminMediaQueryInput = z.infer<typeof AdminMediaQueryInput>;

export const AdminUpdatePhotoInput = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  caption: z.string().trim().max(300).optional().nullable(),
  altText: z.string().trim().max(300).optional().nullable(),
});
export type AdminUpdatePhotoInput = z.infer<typeof AdminUpdatePhotoInput>;

export const AdminBulkMediaInput = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one photo ID is required'),
  action: z.enum(['approve', 'reject', 'restore']),
});
export type AdminBulkMediaInput = z.infer<typeof AdminBulkMediaInput>;

const albumSlugSchema = z
  .string()
  .trim()
  .min(1, 'Album is required')
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Album slug may only contain lowercase letters, numbers, and dashes');

export const AdminUploadSignInput = z.object({
  albumSlug: albumSlugSchema,
});
export type AdminUploadSignInput = z.infer<typeof AdminUploadSignInput>;

export const AdminCreatePhotoInput = z.object({
  publicId: z
    .string()
    .trim()
    .min(3, 'publicId is required')
    .max(255)
    .regex(/^[a-zA-Z0-9/_-]+$/, 'publicId contains unsupported characters'),
  albumSlug: albumSlugSchema,
  altText: z.string().trim().max(300).optional().nullable(),
  caption: z.string().trim().max(300).optional().nullable(),
});
export type AdminCreatePhotoInput = z.infer<typeof AdminCreatePhotoInput>;

export const AdminSettingsUpdateInput = z.object({
  mode: z.enum(['PRE', 'LIVE', 'POST']).optional(),
  rsvpDeadline: z.string().optional().nullable(),
  uploadsOpen: z.boolean().optional(),
  uploadsCloseAt: z.string().optional().nullable(),
  liveStreamUrl: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'Live stream URL must use HTTPS')
    .optional()
    .nullable()
    .or(z.literal('')),
});
export type AdminSettingsUpdateInput = z.infer<typeof AdminSettingsUpdateInput>;

export interface RsvpListRow {
  guestId: string;
  guestName: string;
  side: 'PARTNER_A' | 'PARTNER_B' | 'BOTH';
  email: string | null;
  phone: string | null;
  status: 'PENDING' | 'ATTENDING' | 'DECLINED';
  source: 'WEB' | 'PHONE' | 'WHATSAPP' | null;
  maxPartySize: number;
  headcount: number;
  headcountByEvent: Record<string, number>;
  respondedAt: string | null;
  attendees: Array<{
    name: string;
    events: string[];
    meal: string | null;
    dietary: string | null;
  }>;
  songRequest: string | null;
  message: string | null;
}
