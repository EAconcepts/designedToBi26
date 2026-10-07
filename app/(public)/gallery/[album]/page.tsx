import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSettings } from '@/lib/settings';
import { getPhotos } from '@/lib/albums';
import { GalleryGrid } from '@/components/ui/GalleryGrid';

export const revalidate = 60; // ISR per §3.2

interface AlbumPageProps {
  params: Promise<{ album: string }>;
}

export default async function AlbumDetailPage({ params }: AlbumPageProps) {
  const { album: albumSlug } = await params;
  const setting = await getSettings();

  const data = await getPhotos(albumSlug, setting.mode);

  if (!data) {
    notFound();
  }

  return (
    <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold-700 hover:text-gold-900 font-semibold mb-4 transition-colors"
        >
          <span>←</span>
          <span>Back to All Collections</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-ink-100 pb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-magenta-950">
              {data.album.title}
            </h1>
            <p className="text-xs sm:text-sm text-ink-600 mt-1">
              {data.total} {data.total === 1 ? 'photograph' : 'photographs'} curated with care.
            </p>
          </div>
        </div>
      </div>

      {/* Photo Grid with Interactive Lightbox */}
      <section aria-label={`${data.album.title} photographs`}>
        <GalleryGrid photos={data.photos} albumTitle={data.album.title} />
      </section>
    </div>
  );
}
