import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { AdminGuestQueryInput, CreateGuestInput } from '@/lib/validation/admin';
import { revalidateSite } from '@/lib/cache';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { searchParams } = new URL(request.url);
    const parsed = AdminGuestQueryInput.safeParse({
      q: searchParams.get('q') || undefined,
      side: searchParams.get('side') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parsed.success) {
      return fail('VALIDATION', 'Invalid query parameters');
    }

    const { q, side, page, limit } = parsed.data;
    const where: Prisma.GuestWhereInput = {};

    if (side) {
      where.side = side;
    }

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, guests] = await Promise.all([
      prisma.guest.count({ where }),
      prisma.guest.findMany({
        where,
        orderBy: { displayName: 'asc' },
        skip,
        take: limit,
        include: {
          invitations: {
            include: {
              event: { select: { slug: true, title: true } },
            },
          },
          rsvp: {
            select: { status: true, respondedAt: true, source: true },
          },
        },
      }),
    ]);

    const rows = guests.map((g) => ({
      id: g.id,
      displayName: g.displayName,
      email: g.email,
      phone: g.phone,
      side: g.side,
      maxPartySize: g.maxPartySize,
      createdAt: g.createdAt.toISOString(),
      events: g.invitations.map((i) => ({ slug: i.event.slug, title: i.event.title })),
      rsvpStatus: g.rsvp?.status ?? 'PENDING',
      rsvpSource: g.rsvp?.source ?? null,
      respondedAt: g.rsvp?.respondedAt?.toISOString() ?? null,
    }));

    const response = ok({ rows, total, page, limit });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON payload');
    }

    const input = CreateGuestInput.parse(rawBody);

    // Verify requested event slugs
    const events = await prisma.event.findMany({
      where: { slug: { in: input.eventSlugs } },
      select: { id: true, slug: true },
    });

    if (events.length !== input.eventSlugs.length) {
      return fail('NOT_FOUND', 'One or more selected events do not exist');
    }

    const guest = await prisma.$transaction(async (tx) => {
      const created = await tx.guest.create({
        data: {
          displayName: input.displayName,
          email: input.email ? input.email.toLowerCase() : null,
          phone: input.phone || null,
          side: input.side,
          maxPartySize: input.maxPartySize,
          invitations: {
            create: events.map((ev) => ({
              eventId: ev.id,
            })),
          },
        },
        include: {
          invitations: {
            include: { event: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'GUEST_CREATE',
          entity: 'Guest',
          entityId: created.id,
          meta: {
            displayName: created.displayName,
            maxPartySize: created.maxPartySize,
          },
        },
      });

      return created;
    });

    await revalidateSite(['/rsvp', '/admin/guests', '/admin/rsvps']);

    const response = ok({ guest }, { status: 201 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}
