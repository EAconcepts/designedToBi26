import { prisma } from '../lib/db';
import { createArchive } from '../lib/cloudinary';
import { MediaStatus } from '@prisma/client';

async function run() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));

  if (!slug) {
    const validAlbums = await prisma.album.findMany({ select: { slug: true } });
    console.error('Usage: pnpm zip:album <slug>');
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

  const photos = await prisma.photo.findMany({
    where: {
      albumId: album.id,
      status: MediaStatus.APPROVED,
    },
    select: { publicId: true },
  });

  if (photos.length === 0) {
    console.log(`No approved photos found for album "${album.title}". Cannot create zip archive.`);
    process.exit(0);
  }

  console.log(`\n📦 Generating zip archive for "${album.title}" (${photos.length} photos)...`);

  const archiveUrl = await createArchive(
    photos.map((p) => p.publicId),
    `wedding_${album.slug}`,
  );

  console.log('✅ Archive created successfully!');
  console.log('\nSigned download URL (valid for 24h):');
  console.log(archiveUrl, '\n');

  await prisma.$disconnect();
}

if (process.argv[1] && process.argv[1].endsWith('zip-album.ts')) {
  void run().catch((err) => {
    console.error('Archive generation failed:', err);
    process.exit(1);
  });
}
