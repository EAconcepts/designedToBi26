import Link from 'next/link';
import { CloudImage } from '@/components/ui/CloudImage';
import { AlbumLockedCard } from '@/components/ui/AlbumLockedCard';
import type { AlbumWithCounts } from '@/lib/albums';

export interface AlbumGridProps {
  albums: AlbumWithCounts[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {albums.map((album) => {
        if (album.isLocked) {
          return (
            <AlbumLockedCard key={album.id} title={album.title} condition={album.lockCondition} />
          );
        }

        return (
          <Link
            key={album.id}
            href={`/gallery/${album.slug}`}
            className="group block rounded-2xl border border-gold-500/30 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2 flex flex-col"
          >
            {/* Cover Photo */}
            <div className="relative aspect-4/3 w-full bg-ivory-200 overflow-hidden">
              <CloudImage
                src={album.coverUrl}
                alt={album.coverPhoto?.altText || `${album.title} Cover`}
                width={album.coverPhoto?.width || 800}
                height={album.coverPhoto?.height || 600}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Photo Count Chip */}
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-medium tracking-wide">
                📷 {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
              </div>
            </div>

            {/* Album Information */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gold-700 font-semibold font-sans">
                  Collection
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 group-hover:text-magenta-900 transition-colors mt-0.5">
                  {album.title}
                </h3>
              </div>

              <div className="pt-2 border-t border-ink-100 flex items-center justify-between text-xs font-semibold text-magenta-900">
                <span>View Full Album</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
