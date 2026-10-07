import { describe, expect, it } from 'vitest';
import { naturalSortComparator } from '@/scripts/sync-album';

describe('scripts/sync-album naturalSortComparator', () => {
  it('correctly orders filenames using natural numerical sorting', () => {
    const filenames = [
      'wedding/pre-wedding/img-10.jpg',
      'wedding/pre-wedding/img-2.jpg',
      'wedding/pre-wedding/img-1.jpg',
      'wedding/pre-wedding/img-20.jpg',
    ];

    const sorted = [...filenames].sort(naturalSortComparator);

    expect(sorted).toEqual([
      'wedding/pre-wedding/img-1.jpg',
      'wedding/pre-wedding/img-2.jpg',
      'wedding/pre-wedding/img-10.jpg',
      'wedding/pre-wedding/img-20.jpg',
    ]);
  });

  it('handles mixed case and alphabetical prefixes', () => {
    const list = ['photo-b.png', 'photo-A.png', 'photo-1.png'];
    const sorted = [...list].sort(naturalSortComparator);
    expect(sorted[0]).toBe('photo-1.png');
  });
});
