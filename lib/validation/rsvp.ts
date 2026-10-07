import { z } from 'zod';

export const RsvpAttendeeInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  events: z.array(z.string().min(1).max(40)).min(1, 'Please select at least one event'),
  meal: z.string().trim().max(60, 'Meal choice cannot exceed 60 characters').optional(),
  dietary: z
    .string()
    .trim()
    .max(200, 'Dietary requirements cannot exceed 200 characters')
    .optional(),
});

export type RsvpAttendeeInput = z.infer<typeof RsvpAttendeeInput>;

export const RsvpInput = z.object({
  declined: z.boolean().default(false),
  attendees: z.array(RsvpAttendeeInput).max(10, 'Cannot exceed 10 attendees').default([]),
  songRequest: z.string().trim().max(120, 'Song request cannot exceed 120 characters').optional(),
  message: z.string().trim().max(600, 'Message cannot exceed 600 characters').optional(),
});

export type RsvpInput = z.infer<typeof RsvpInput>;

// Admin override of the same payload (Subphase 2.5)
export const AdminRsvpInput = RsvpInput.extend({
  guestId: z.string().min(1, 'Guest ID is required'),
  source: z.enum(['PHONE', 'WHATSAPP']).default('PHONE'),
});

export type AdminRsvpInput = z.infer<typeof AdminRsvpInput>;
