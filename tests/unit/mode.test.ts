import { describe, it, expect } from 'vitest';
import { ORDER, getMode, isAlbumVisible, type SiteMode } from '@/lib/mode';

describe('lib/mode', () => {
  it('ORDER maps PRE < LIVE < POST', () => {
    expect(ORDER.PRE).toBeLessThan(ORDER.LIVE);
    expect(ORDER.LIVE).toBeLessThan(ORDER.POST);
  });

  it('getMode returns PRE by default when setting is null or undefined', () => {
    expect(getMode(null)).toBe('PRE');
    expect(getMode(undefined)).toBe('PRE');
  });

  it('evaluates all 9 combinations of isAlbumVisible correctly', () => {
    const modes: SiteMode[] = ['PRE', 'LIVE', 'POST'];

    const expectedMatrix: Record<SiteMode, Record<SiteMode, boolean>> = {
      PRE: {
        PRE: true,
        LIVE: true,
        POST: true,
      },
      LIVE: {
        PRE: false,
        LIVE: true,
        POST: true,
      },
      POST: {
        PRE: false,
        LIVE: false,
        POST: true,
      },
    };

    for (const visibleFrom of modes) {
      for (const currentMode of modes) {
        const expected = expectedMatrix[visibleFrom][currentMode];
        const result = isAlbumVisible(visibleFrom, currentMode);
        expect(result).toBe(expected);
      }
    }
  });
});
