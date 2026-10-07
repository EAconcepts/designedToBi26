import { describe, expect, it } from 'vitest';
import { isAlbumVisible } from '@/lib/mode';
import { getAlbumLockCondition } from '@/lib/albums';
import { SiteMode } from '@prisma/client';

describe('lib/albums & Mode Visibility Matrix', () => {
  it('enforces album unlock conditions according to site mode hierarchy', () => {
    // 1. In PRE mode:
    expect(isAlbumVisible(SiteMode.PRE, SiteMode.PRE)).toBe(true);
    expect(isAlbumVisible(SiteMode.LIVE, SiteMode.PRE)).toBe(false);
    expect(isAlbumVisible(SiteMode.POST, SiteMode.PRE)).toBe(false);

    // 2. In LIVE mode:
    expect(isAlbumVisible(SiteMode.PRE, SiteMode.LIVE)).toBe(true);
    expect(isAlbumVisible(SiteMode.LIVE, SiteMode.LIVE)).toBe(true);
    expect(isAlbumVisible(SiteMode.POST, SiteMode.LIVE)).toBe(false);

    // 3. In POST mode:
    expect(isAlbumVisible(SiteMode.PRE, SiteMode.POST)).toBe(true);
    expect(isAlbumVisible(SiteMode.LIVE, SiteMode.POST)).toBe(true);
    expect(isAlbumVisible(SiteMode.POST, SiteMode.POST)).toBe(true);
  });

  it('provides honest copy for locked albums', () => {
    expect(getAlbumLockCondition(SiteMode.LIVE)).toContain('19 Dec 2026');
    expect(getAlbumLockCondition(SiteMode.POST)).toContain('following the wedding celebration');
    expect(getAlbumLockCondition(SiteMode.PRE)).toBe('Available');
  });
});
