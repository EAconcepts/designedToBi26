import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSettings } from '@/lib/settings';
import { ALBUM_PHOTOS_PAGE_SIZE, getPhotos } from '@/lib/albums';
import { GalleryGrid } from '@/components/ui/GalleryGrid';

export const revalidate = 60; // ISR per §3.2

interface AlbumPageProps {
  params: Promise<{ album: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function AlbumDetailPage({ params, searchParams }: AlbumPageProps) {
  const [{ album: albumSlug }, query] = await Promise.all([params, searchParams]);
  const rawPage = query.page;
  const requestedPage =
    typeof rawPage === 'string' &&
    /^[1-9]\d*$/.test(rawPage) &&
    Number.isSafeInteger(Number(rawPage))
      ? Number(rawPage)
      : 1;
  const setting = await getSettings();

  const data = await getPhotos(albumSlug, setting.mode, requestedPage);

  if (!data) {
    notFound();
  }

  const pageStart = data.total === 0 ? 0 : (data.page - 1) * ALBUM_PHOTOS_PAGE_SIZE + 1;
  const pageEnd = Math.min(data.page * ALBUM_PHOTOS_PAGE_SIZE, data.total);

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

      {data.totalPages > 1 && (
        <nav
          aria-label="Gallery pagination"
          className="flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-5 sm:flex-row"
        >
          <p className="text-xs text-ink-600" aria-live="polite">
            Showing {pageStart}–{pageEnd} of {data.total} photographs · Page {data.page} of{' '}
            {data.totalPages}
          </p>
          <div className="flex items-center gap-3">
            {data.page > 1 ? (
              <Link
                href={`/gallery/${albumSlug}?page=${data.page - 1}`}
                rel="prev"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-800 transition-colors hover:bg-ivory-100"
              >
                Previous photos
              </Link>
            ) : (
              <span className="inline-flex min-h-[44px] items-center rounded-xl border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-400">
                Previous photos
              </span>
            )}
            {data.page < data.totalPages ? (
              <Link
                href={`/gallery/${albumSlug}?page=${data.page + 1}`}
                rel="next"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-magenta-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-magenta-950"
              >
                More photos
              </Link>
            ) : (
              <span className="inline-flex min-h-[44px] items-center rounded-xl border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-400">
                More photos
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
