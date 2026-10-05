import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SITE } from '@/content/site.config';

describe('Brand contract', () => {
  it('has a logo path starting with /brand/ and the asset exists on disk', () => {
    const { src, width, height, kind } = SITE.brand.logo;

    expect(src.startsWith('/brand/')).toBe(true);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(['svg', 'png']).toContain(kind);

    const assetPath = path.resolve(process.cwd(), 'public', src.replace(/^\//, ''));
    expect(fs.existsSync(assetPath)).toBe(true);
  });

  it('provides all brand and wedding essential metadata in SITE', () => {
    expect(SITE.couple.a).toBeTruthy();
    expect(SITE.couple.b).toBeTruthy();
    expect(SITE.couple.initials).toBe('AE');
    expect(SITE.hashtag).toBe("#designedToBi'26");
    expect(SITE.timezone).toBe('Africa/Lagos');
    expect(SITE.colours).toContain('White');
    expect(SITE.colours).toContain('Gold');
    expect(SITE.colours).toContain('Magenta');
  });
});
