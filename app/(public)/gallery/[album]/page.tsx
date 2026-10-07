'use client';

import { useState } from 'react';
import Link from 'next/link';

const galleryPhotos = [
  '/img-7.jpg',
  '/img-6.jpg',
  '/img-5.jpg',
  '/img-4.jpg',
  '/img-3.jpg',
  '/img-2.jpg',
  '/img-1.jpg',
];

export default function AlbumDetailPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="route-page album-detail">
      <header className="album-detail__header">
        <Link href="/gallery" className="back-link">
          ← All albums
        </Link>
        <p className="section-kicker">Album 01 · {galleryPhotos.length} photographs</p>
        <h1>
          Before
          <br />
          <em>forever</em>
        </h1>
        <p>Pre-wedding · Ilorin, 2026</p>
      </header>

      <section className="masonry-grid">
        {galleryPhotos.map((photo, index) => (
          <button
            key={`${photo}-${index}`}
            onClick={() => setSelected(index)}
            type="button"
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`Adetolani and Abiodun, portrait ${index + 1}`}
              width={600}
              height={800}
              loading="lazy"
            />
          </button>
        ))}
      </section>

      {selected !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photograph preview">
          <button className="lightbox__close" onClick={() => setSelected(null)} type="button">
            Close ×
          </button>
          <button
            onClick={() =>
              setSelected((selected + galleryPhotos.length - 1) % galleryPhotos.length)
            }
            type="button"
          >
            ←
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={galleryPhotos[selected % galleryPhotos.length]}
            alt={`Portrait ${selected + 1}`}
            width={1200}
            height={1600}
          />
          <button onClick={() => setSelected((selected + 1) % galleryPhotos.length)} type="button">
            →
          </button>
          <span>{String(selected + 1).padStart(2, '0')} / 09</span>
        </div>
      )}
    </div>
  );
}
