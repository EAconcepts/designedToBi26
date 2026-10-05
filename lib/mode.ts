import type { Setting, SiteMode } from '@prisma/client';

export type { SiteMode };

export const ORDER: Record<SiteMode, number> = {
  PRE: 0,
  LIVE: 1,
  POST: 2,
};

export function getMode(setting?: Setting | null): SiteMode {
  return setting?.mode ?? 'PRE';
}

export function isAlbumVisible(albumVisibleFrom: SiteMode, currentMode: SiteMode): boolean {
  return ORDER[currentMode] >= ORDER[albumVisibleFrom];
}
