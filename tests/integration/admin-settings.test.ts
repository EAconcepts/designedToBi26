import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET as getSettingsRoute,
  PATCH as patchSettingsRoute,
} from '@/app/api/admin/settings/route';
import { POST as rotateTokenRoute } from '@/app/api/admin/settings/upload-token/route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin';
import { isBeforeDeadline } from '@/lib/datetime';

describe('Admin Settings & Mode Toggle Integration (Subphase 3.6)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await prisma.auditLog.deleteMany({ where: { entity: 'Setting' } });
    await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        mode: 'PRE',
        uploadsOpen: false,
        uploadToken: 'initial-token-123',
        liveStreamUrl: null,
      },
      create: {
        id: 1,
        mode: 'PRE',
        uploadsOpen: false,
        uploadToken: 'initial-token-123',
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.auditLog.deleteMany({ where: { entity: 'Setting' } });
    await prisma.setting.update({
      where: { id: 1 },
      data: {
        mode: 'PRE',
        uploadsOpen: false,
        uploadToken: null,
      },
    });
  });

  it('rejects unauthenticated requests with 401 UNAUTHENTICATED', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(null);

    const reqGet = new NextRequest('http://localhost:3000/api/admin/settings');
    const resGet = await getSettingsRoute(reqGet);
    expect(resGet.status).toBe(401);

    const reqPatch = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'LIVE' }),
    });
    const resPatch = await patchSettingsRoute(reqPatch);
    expect(resPatch.status).toBe(401);

    const reqRotate = new NextRequest('http://localhost:3000/api/admin/settings/upload-token', {
      method: 'POST',
    });
    const resRotate = await rotateTokenRoute(reqRotate);
    expect(resRotate.status).toBe(401);
  });

  it('retrieves settings with upload URL and valid SVG QR code', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const req = new NextRequest('http://localhost:3000/api/admin/settings');
    const res = await getSettingsRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.mode).toBe('PRE');
    expect(json.data.uploadUrl).toContain('/upload/initial-token-123');
    expect(json.data.uploadQrSvg).toContain('<svg');
  });

  it('updates site mode, rsvp deadline, and logs an AuditLog entry', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'LIVE',
        rsvpDeadline: '2026-12-05',
        uploadsOpen: true,
        liveStreamUrl: 'https://youtube.com/live/celebration',
      }),
    });

    const res = await patchSettingsRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.mode).toBe('LIVE');
    expect(json.data.uploadsOpen).toBe(true);
    expect(json.data.liveStreamUrl).toBe('https://youtube.com/live/celebration');

    // Verify DB row
    const dbSetting = await prisma.setting.findUnique({ where: { id: 1 } });
    expect(dbSetting?.mode).toBe('LIVE');
    expect(dbSetting?.uploadsOpen).toBe(true);

    // Verify AuditLog record
    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'Setting', action: 'SETTINGS_UPDATE' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actor).toBe('admin@example.com');
  });

  it('rotates upload token, updates DB, returns SVG QR and invalidates old token', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const req = new NextRequest('http://localhost:3000/api/admin/settings/upload-token', {
      method: 'POST',
    });

    const res = await rotateTokenRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.token).toBeDefined();
    expect(json.data.token).not.toBe('initial-token-123');
    expect(json.data.qrSvg).toContain('<svg');
    expect(json.data.uploadUrl).toContain(json.data.token);

    // Verify DB updated
    const dbSetting = await prisma.setting.findUnique({ where: { id: 1 } });
    expect(dbSetting?.uploadToken).toBe(json.data.token);

    // Verify AuditLog was recorded with redacted token
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'UPLOAD_TOKEN_ROTATE' },
    });
    expect(audit).not.toBeNull();
    expect(JSON.stringify(audit?.meta)).not.toContain(json.data.token);
  });

  it('accurately enforces WAT timezone deadline boundary (2026-12-05T22:59Z open, 2026-12-06T00:01Z closed)', () => {
    const deadlineString = '2026-12-05'; // End of day Africa/Lagos (23:59:59.999 +01:00 = 22:59:59.999 UTC)

    // At 22:59:00 UTC on 5 Dec (23:59:00 WAT) -> OPEN
    const timeBefore = new Date('2026-12-05T22:59:00.000Z');
    expect(isBeforeDeadline(timeBefore, deadlineString)).toBe(true);

    // At 00:01:00 UTC on 6 Dec (01:01:00 WAT) -> CLOSED
    const timeAfter = new Date('2026-12-06T00:01:00.000Z');
    expect(isBeforeDeadline(timeAfter, deadlineString)).toBe(false);
  });
});
