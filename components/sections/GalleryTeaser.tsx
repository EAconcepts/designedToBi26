'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Monogram } from '@/components/brand';

// const photos = {
//   galleryOne:
//     'https://images.unsplash.com/photo-1770777352506-c36821bf7da8?auto=format&fit=crop&w=1000&q=85',
//   galleryTwo:
//     'https://images.unsplash.com/photo-1770777352898-f0f02bcfb44f?auto=format&fit=crop&w=1000&q=85',
//   galleryThree:
//     'https://images.unsplash.com/photo-1770777353033-e32b07f31a6e?auto=format&fit=crop&w=1000&q=85',
// };

const photos = {
  galleryOne: '/img-7.jpg',
  galleryTwo: '/img-6.jpg',
  galleryThree: '/img-5.jpg',
};

export function GalleryTeaser() {
  const [galleryTab, setGalleryTab] = useState<'pre' | 'day'>('pre');

  return (
    <section className="gallery paper-section" id="gallery">
      <div className="section-title">
        <p className="section-kicker">A glimpse of us</p>
        <h2>Our gallery</h2>
      </div>

      <div className="gallery-tabs" role="tablist">
        <button
          className={galleryTab === 'pre' ? 'active' : ''}
          onClick={() => setGalleryTab('pre')}
          role="tab"
          type="button"
        >
          Pre-wedding
        </button>
        <button
          className={galleryTab === 'day' ? 'active' : ''}
          onClick={() => setGalleryTab('day')}
          role="tab"
          type="button"
        >
          Wedding day
        </button>
      </div>

      {galleryTab === 'pre' ? (
        <div className="gallery-grid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos.galleryOne}
            alt="Elegant traditional bridal portrait"
            width={600}
            height={800}
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos.galleryTwo}
            alt="Bride in gold ceremonial attire"
            width={600}
            height={800}
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos.galleryThree}
            alt="Detailed bridal portrait"
            width={600}
            height={800}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="coming-soon">
          <Monogram compact />
          <h3>Our next chapter is still being written.</h3>
          <p>Wedding day photographs will be shared here after the celebration.</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/gallery" className="button button--magenta">
          Explore all photographs →
        </Link>
      </div>
    </section>
  );
}
