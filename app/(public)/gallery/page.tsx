import { getSettings } from '@/lib/settings';
import { getVisibleAlbums } from '@/lib/albums';
import { isUploadActive } from '@/lib/uploads';
import Link from 'next/link';
import { AlbumGrid } from '@/components/sections/AlbumGrid';
import { SITE } from '@/content/site.config';

export const revalidate = 60; // ISR 60s per §3.2

export const metadata = {
  title: 'Photo Gallery | Adetolani & Emmanuel',
  description:
    'Moments between moments: pre-wedding memories, celebration highlights, and guest captures.',
};

export default async function GalleryPage() {
  const setting = await getSettings();
  const albums = await getVisibleAlbums(setting.mode);

  return (
    <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
      {/* Editorial Header */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-12 h-12 mx-auto rounded-full bg-magenta-900 text-light-gold flex items-center justify-center font-serif font-bold text-lg shadow-sm">
          {SITE.couple.initials}
        </div>
        <p className="text-xs uppercase tracking-widest text-ink-600 font-semibold font-sans">
          The Moments Between Moments
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-magenta-950 tracking-tight">
          Wedding <em className="italic font-normal text-magenta-800">Gallery</em>
        </h1>
        <p className="text-sm sm:text-base text-ink-600 leading-relaxed pt-1">
          A timeless collection of our journey, cherished memories, and celebration captures shared
          with love.
        </p>
      </header>

      {/* Guest Upload CTA — only while the upload window is open */}
      {isUploadActive(setting) && (
        <div className="flex justify-center">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-xs font-semibold shadow-sm transition-colors !text-white"
          >
            Share your celebration photos →
          </Link>
        </div>
      )}

      {/* Album Collections Grid */}
      <section aria-label="Wedding photo albums">
        <AlbumGrid albums={albums} />
      </section>
    </div>
  );
}
