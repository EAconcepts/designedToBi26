import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as guestLink } from '@/app/(public)/i/[code]/route';
import { GET as guestSession } from '@/app/api/session/guest/route';
import { GUEST_COOKIE_NAME, signGuestCode } from '@/lib/guest-cookie';
import { prisma } from '@/lib/db';
import { makeEvent, makeGuest, makeInvitation } from '@/tests/factories';

const getLink = (code: string) =>
  guestLink(new Request(`http://localhost:3000/i/${code}`), { params: Promise.resolve({ code }) });

describe('guest invitation links', () => {
  it('gives valid and unknown codes the same redirect while only valid codes set a cookie', async () => {
    const guest = await makeGuest();
    const valid = await getLink(guest.code);
    const unknown = await getLink('zzzzzzzz');

    expect(valid.status).toBe(307);
    expect(unknown.status).toBe(307);
    expect(valid.headers.get('location')).toBe('http://localhost:3000/');
    expect(unknown.headers.get('location')).toBe('http://localhost:3000/');
    expect(valid.headers.get('set-cookie')).toContain(`${GUEST_COOKIE_NAME}=`);
    expect(unknown.headers.get('set-cookie')).toBeNull();
  });

  it('records only the first opening time', async () => {
    const guest = await makeGuest();
    await getLink(guest.code);
    const firstOpenedAt = (await prisma.guest.findUniqueOrThrow({ where: { id: guest.id } }))
      .openedAt;
    await getLink(guest.code);
    const secondOpenedAt = (await prisma.guest.findUniqueOrThrow({ where: { id: guest.id } }))
      .openedAt;
    expect(firstOpenedAt).not.toBeNull();
    expect(secondOpenedAt?.getTime()).toBe(firstOpenedAt?.getTime());
  });

  it('returns only the public session fields for a valid signed cookie', async () => {
    const guest = await makeGuest({
      displayName: 'The Session Family',
      email: 'private@example.com',
      phone: '+23480000000',
    });
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);
    const response = await guestSession(
      new NextRequest('http://localhost:3000/api/session/guest', {
        headers: { cookie: `${GUEST_COOKIE_NAME}=${signGuestCode(guest.code)}` },
      }),
    );
    const body = await response.json();

    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toMatchObject({
      ok: true,
      data: { guest: { displayName: 'The Session Family', events: [event.slug] } },
    });
    expect(JSON.stringify(body)).not.toContain('private@example.com');
    expect(JSON.stringify(body)).not.toContain('+23480000000');
  });

  it('treats a tampered cookie as an anonymous session', async () => {
    const guest = await makeGuest();
    const token = `${signGuestCode(guest.code).slice(0, -1)}0`;
    const response = await guestSession(
      new NextRequest('http://localhost:3000/api/session/guest', {
        headers: { cookie: `${GUEST_COOKIE_NAME}=${token}` },
      }),
    );

    expect(await response.json()).toEqual({ ok: true, data: { guest: null } });
  });
});
