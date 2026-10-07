'use client';

import { useState } from 'react';
import { CloudImage } from './CloudImage';
import { Lightbox, type LightboxPhoto } from './Lightbox';

export interface GalleryGridProps {
  photos: LightboxPhoto[];
  albumTitle: string;
}

export function GalleryGrid({ photos, albumTitle }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-dashed border-ink-200 bg-ivory-100/50 p-8 space-y-3 max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto rounded-full bg-ivory-200 text-ink-400 flex items-center justify-center text-xl">
          📷
        </div>
        <h3 className="font-serif text-lg font-bold text-ink-900">No Photos in this Album Yet</h3>
        <p className="text-xs text-ink-600">
          Photographs are currently being curated and will appear here shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            aria-label={`View photo ${index + 1} of ${photos.length} in ${albumTitle}`}
            className="group relative aspect-square w-full overflow-hidden rounded-xl bg-ivory-200 border border-gold-500/20 shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2"
          >
            <CloudImage
              src={photo.thumbSrc || photo.src}
              publicId={photo.publicId}
              alt={photo.altText || photo.caption || `Photo ${index + 1}`}
              width={photo.width || 600}
              height={photo.height || 600}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
              {photo.caption && (
                <p className="text-[11px] text-white line-clamp-1 italic font-serif">
                  {photo.caption}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        photos={photos}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(newIdx) => setLightboxIndex(newIdx)}
      />
    </>
  );
}
