import { type NextRequest } from 'next/server';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { revalidateSite } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const newToken = crypto.randomBytes(16).toString('hex'); // 32 chars unambiguous token
    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const uploadUrl = `${siteUrl}/upload/${newToken}`;

    const qrSvg = await QRCode.toString(uploadUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#3D0026', // magenta-950
        light: '#FFFFFA', // ivory-100
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.setting.update({
        where: { id: 1 },
        data: { uploadToken: newToken },
      });

      // AuditLog without logging raw secret token per §3.6
      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'UPLOAD_TOKEN_ROTATE',
          entity: 'Setting',
          entityId: '1',
          meta: {
            redactedTokenLength: newToken.length,
            rotatedAt: new Date().toISOString(),
          },
        },
      });
    });

    await revalidateSite(['/upload']);

    return ok({
      token: newToken,
      qrSvg,
      uploadUrl,
    });
  });
}
