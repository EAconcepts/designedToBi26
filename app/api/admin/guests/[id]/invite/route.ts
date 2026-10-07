import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { env } from '@/lib/env';
import { SITE } from '@/content/site.config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { id } = await context.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      select: { id: true, code: true, displayName: true },
    });

    if (!guest) {
      return fail('NOT_FOUND', 'Guest not found');
    }

    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const link = `${siteUrl}/i/${guest.code}`;
    const whatsappMessage = SITE.inviteMessage
      .replace(/{{name}}/g, guest.displayName)
      .replace(/{{link}}/g, link);

    const response = ok({ link, whatsappMessage });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}
