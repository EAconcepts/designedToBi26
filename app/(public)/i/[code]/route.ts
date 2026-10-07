import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidGuestCode, normalizeGuestCode } from '@/lib/codes';
import { setGuestCookie } from '@/lib/guest-cookie';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code: rawCode } = await context.params;
  const code = normalizeGuestCode(rawCode);
  // Always issue the same redirect. The placeholder query also avoids a distinguishable fast path.
  const guest = await prisma.guest.findUnique({
    where: { code: isValidGuestCode(code) ? code : 'xxxxxxxx' },
    select: { id: true },
  });
  const response = NextResponse.redirect(new URL('/', _request.url), 307);

  if (!guest) return response;

  await prisma.guest.updateMany({
    where: { id: guest.id, openedAt: null },
    data: { openedAt: new Date() },
  });
  setGuestCookie(response, code);
  return response;
}
