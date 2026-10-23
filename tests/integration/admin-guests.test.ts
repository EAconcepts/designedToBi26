import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getGuestsRoute, POST as postGuestRoute } from '@/app/api/admin/guests/route';
import {
  PATCH as patchGuestRoute,
  DELETE as deleteGuestRoute,
} from '@/app/api/admin/guests/[id]/route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin';
import { makeGuest, makeEvent, cleanupTestRows } from '@/tests/factories';

describe('Admin Guests API Integration', () => {
  beforeEach(async () => {
    await cleanupTestRows();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await cleanupTestRows();
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/guests');
    const res = await getGuestsRoute(req);
    expect(res.status).toBe(401);
  });

  it('creates a new guest with invitations and an AuditLog entry', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const event1 = await makeEvent();
    const event2 = await makeEvent();

    const req = new NextRequest('http://localhost:3000/api/admin/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Professor & Mrs. Oladipo',
        email: 'oladipo@example.com',
        phone: '+2348033334444',
        side: 'PARTNER_A',
        maxPartySize: 3,
        eventSlugs: [event1.slug, event2.slug],
      }),
    });

    const res = await postGuestRoute(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const guestId = body.data.guest.id;
    const guestInDb = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { invitations: true },
    });

    expect(guestInDb).not.toBeNull();
    expect(guestInDb?.displayName).toBe('Professor & Mrs. Oladipo');
    expect(guestInDb?.maxPartySize).toBe(3);
    expect(guestInDb?.invitations).toHaveLength(2);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: guestId, action: 'GUEST_CREATE' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actor).toBe('admin@example.com');
  });

  it('updates guest details and invitations via PATCH', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const guest = await makeGuest({ displayName: 'Original Name', maxPartySize: 1 });
    const event1 = await makeEvent();

    const req = new NextRequest(`http://localhost:3000/api/admin/guests/${guest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Updated Name',
        maxPartySize: 4,
        eventSlugs: [event1.slug],
      }),
    });

    const res = await patchGuestRoute(req, { params: Promise.resolve({ id: guest.id }) });
    expect(res.status).toBe(200);

    const updatedInDb = await prisma.guest.findUnique({
      where: { id: guest.id },
      include: { invitations: true },
    });

    expect(updatedInDb?.displayName).toBe('Updated Name');
    expect(updatedInDb?.maxPartySize).toBe(4);
    expect(updatedInDb?.invitations).toHaveLength(1);
  });

  it('records a GUEST_DELETE audit entry without code metadata', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const guest = await makeGuest({ displayName: 'Guest To Delete' });

    const req = new NextRequest(`http://localhost:3000/api/admin/guests/${guest.id}`, {
      method: 'DELETE',
    });
    const res = await deleteGuestRoute(req, { params: Promise.resolve({ id: guest.id }) });
    expect(res.status).toBe(200);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: guest.id, action: 'GUEST_DELETE' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.meta).not.toHaveProperty('code');
  });
});
