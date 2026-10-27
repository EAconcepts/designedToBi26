import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { revalidateSite } from '@/lib/cache';
import { getSettingsUncached } from '@/lib/settings';
import { AdminSettingsUpdateInput } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const setting = await getSettingsUncached();
    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const uploadUrl = `${siteUrl}/upload`;

    return ok({
      ...setting,
      uploadUrl,
    });
  });
}

export async function PATCH(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const body = await req.json();
    const input = AdminSettingsUpdateInput.parse(body);
    const existing = await getSettingsUncached();

    const dataToUpdate: Record<string, unknown> = {};

    if (input.mode !== undefined) {
      dataToUpdate.mode = input.mode;
    }
    if (input.rsvpDeadline !== undefined) {
      if (!input.rsvpDeadline) {
        dataToUpdate.rsvpDeadline = null;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(input.rsvpDeadline)) {
        // WAT semantics: end-of-day Africa/Lagos (+01:00)
        dataToUpdate.rsvpDeadline = new Date(`${input.rsvpDeadline}T23:59:59.999+01:00`);
      } else {
        dataToUpdate.rsvpDeadline = new Date(input.rsvpDeadline);
      }
    }
    if (input.uploadsOpen !== undefined) {
      dataToUpdate.uploadsOpen = input.uploadsOpen;
    }
    if (input.uploadsCloseAt !== undefined) {
      dataToUpdate.uploadsCloseAt = input.uploadsCloseAt ? new Date(input.uploadsCloseAt) : null;
    }
    if (input.liveStreamUrl !== undefined) {
      dataToUpdate.liveStreamUrl = input.liveStreamUrl || null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.setting.update({
        where: { id: 1 },
        data: dataToUpdate,
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'SETTINGS_UPDATE',
          entity: 'Setting',
          entityId: '1',
          meta: {
            changed: Object.keys(dataToUpdate),
            old: {
              mode: existing.mode,
              uploadsOpen: existing.uploadsOpen,
              rsvpDeadline: existing.rsvpDeadline,
            },
            new: {
              mode: s.mode,
              uploadsOpen: s.uploadsOpen,
              rsvpDeadline: s.rsvpDeadline,
            },
          },
        },
      });

      return s;
    });

    // Revalidate public site caches immediately upon mode/deadline/window changes
    await revalidateSite(['/', '/gallery', '/rsvp', '/gift', '/upload']);

    return ok(updated);
  });
}
