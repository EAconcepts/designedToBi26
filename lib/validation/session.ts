import { z } from 'zod';

const RsvpStatusSchema = z.enum(['PENDING', 'ATTENDING', 'DECLINED']);

export const GuestSessionSchema = z
  .object({
    displayName: z.string(),
    maxPartySize: z.number().int().positive(),
    events: z.array(z.string()),
    greeting: z.string(),
    rsvp: z
      .object({
        status: RsvpStatusSchema,
        respondedAt: z.string().nullable(),
        attendees: z.array(
          z.object({
            name: z.string(),
            events: z.array(z.string()),
            meal: z.string().nullable(),
            dietary: z.string().nullable(),
          }),
        ),
        message: z.string().nullable(),
      })
      .nullable(),
  })
  .strict();

export const GuestSessionResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({ guest: GuestSessionSchema.nullable() }),
});

export type GuestSession = z.infer<typeof GuestSessionSchema>;
export type GuestSessionResponse = z.infer<typeof GuestSessionResponseSchema>;
