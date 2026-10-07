import { prisma } from '../lib/db';
import { listFolder, type CloudinaryResource } from '../lib/cloudinary';
import { MediaSource, MediaStatus } from '@prisma/client';

export function naturalSortComparator(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

async function run() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  const isDryRun = args.includes('--dry-run');
  const shouldReorder = args.includes('--reorder');

  if (!slug) {
    const validAlbums = await prisma.album.findMany({ select: { slug: true } });
    console.error('Usage: pnpm sync:album <slug> [--dry-run] [--reorder]');
    console.error('Valid slugs:', validAlbums.map((a) => a.slug).join(', '));
    process.exit(1);
  }

  const album = await prisma.album.findUnique({
    where: { slug },
  });

  if (!album) {
    const validAlbums = await prisma.album.findMany({ select: { slug: true } });
    console.error(`Error: Album with slug "${slug}" not found.`);
    console.error('Valid slugs:', validAlbums.map((a) => a.slug).join(', '));
    process.exit(1);
  }

  console.log(`\n📸 Syncing album "${album.title}" (${album.slug})...`);
  if (isDryRun) {
    console.log('🔍 [DRY RUN MODE] No database changes will be committed.');
  }

  const folder = `wedding/${album.slug}`;
  let allResources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  try {
    do {
      const res = await listFolder(folder, { maxResults: 100, nextCursor });
      allResources = allResources.concat(res.resources);
      nextCursor = res.next_cursor;
    } while (nextCursor);
  } catch (err) {
    console.warn(
      `⚠️ Could not fetch from Cloudinary folder "${folder}":`,
      err instanceof Error ? err.message : err,
    );
    console.log('Skipping sync: Cloudinary folder might not exist yet.');
    process.exit(0);
  }

  console.log(`Found ${allResources.length} assets in Cloudinary folder "${folder}".`);

  // Natural sort by public_id / filename
  allResources.sort((a, b) => naturalSortComparator(a.public_id, b.public_id));

  const existingPhotos = await prisma.photo.findMany({
    where: { albumId: album.id },
  });
  const existingMap = new Map(existingPhotos.map((p) => [p.publicId, p]));

  let maxSortOrder = existingPhotos.reduce((max, p) => Math.max(max, p.sortOrder), 0);

  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (let idx = 0; idx < allResources.length; idx++) {
    const asset = allResources[idx];
    if (!asset) continue;
    const existing = existingMap.get(asset.public_id);
    const assignedSortOrder = shouldReorder ? idx : existing ? existing.sortOrder : ++maxSortOrder;

    if (!existing) {
      createdCount++;
      if (!isDryRun) {
        await prisma.photo.create({
          data: {
            albumId: album.id,
            publicId: asset.public_id,
            width: asset.width,
            height: asset.height,
            sortOrder: assignedSortOrder,
            status: MediaStatus.APPROVED,
            source: MediaSource.ADMIN,
          },
        });
      }
    } else if (
      existing.width !== asset.width ||
      existing.height !== asset.height ||
      (shouldReorder && existing.sortOrder !== assignedSortOrder)
    ) {
      updatedCount++;
      if (!isDryRun) {
        await prisma.photo.update({
          where: { id: existing.id },
          data: {
            width: asset.width,
            height: asset.height,
            sortOrder: assignedSortOrder,
          },
        });
      }
    } else {
      unchangedCount++;
    }
  }

  console.log('\n📊 Sync Summary:');
  console.log(`  - Created:   ${createdCount}`);
  console.log(`  - Updated:   ${updatedCount}`);
  console.log(`  - Unchanged: ${unchangedCount}`);
  console.log(`  - Total:     ${allResources.length}\n`);

  await prisma.$disconnect();
}

if (process.argv[1] && process.argv[1].endsWith('sync-album.ts')) {
  void run().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
}
