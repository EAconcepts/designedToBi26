import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';

export const SITE_CACHE_TAG = 'site';

export function cached<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  opts?: {
    tags?: string[];
    revalidate?: number | false;
  },
): (...args: Args) => Promise<T> {
  const mergedTags = Array.from(new Set([SITE_CACHE_TAG, ...(opts?.tags ?? [])]));

  return unstable_cache(fn, keyParts, {
    tags: mergedTags,
    revalidate: opts?.revalidate,
  });
}

export async function revalidateSite(paths: string[] = ['/']): Promise<void> {
  revalidateTag(SITE_CACHE_TAG, 'max');

  for (const p of paths) {
    if (p) {
      revalidatePath(p);
    }
  }
}
