import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nextCache from 'next/cache';
import { revalidateSite, SITE_CACHE_TAG, cached } from '@/lib/cache';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe('lib/cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revalidateSite(["/", "/gallery"]) calls revalidateTag("site") and revalidatePath once per path', async () => {
    await revalidateSite(['/', '/gallery']);

    expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);
    expect(nextCache.revalidateTag).toHaveBeenCalledWith(SITE_CACHE_TAG, 'max');

    expect(nextCache.revalidatePath).toHaveBeenCalledTimes(2);
    expect(nextCache.revalidatePath).toHaveBeenNthCalledWith(1, '/');
    expect(nextCache.revalidatePath).toHaveBeenNthCalledWith(2, '/gallery');
  });

  it('revalidateSite with a single path calls revalidateTag and revalidatePath once', async () => {
    await revalidateSite(['/']);

    expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);
    expect(nextCache.revalidateTag).toHaveBeenCalledWith(SITE_CACHE_TAG, 'max');

    expect(nextCache.revalidatePath).toHaveBeenCalledTimes(1);
    expect(nextCache.revalidatePath).toHaveBeenCalledWith('/');
  });

  it('cached helper wraps unstable_cache with site tag merged', () => {
    const fn = async () => 'result';
    const wrapped = cached(fn, ['test-key'], { tags: ['custom-tag'] });
    expect(wrapped).toBeDefined();
    expect(nextCache.unstable_cache).toHaveBeenCalledWith(
      fn,
      ['test-key'],
      expect.objectContaining({
        tags: expect.arrayContaining(['site', 'custom-tag']),
      }),
    );
  });
});
