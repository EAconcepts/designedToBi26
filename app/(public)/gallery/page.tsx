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
];

export default function GalleryPage() {
  const [album, setAlbum] = useState<'pre' | 'guest' | 'wedding'>('pre');

  return (
    <div className="route-page">
      <header className="inner-hero">
        <div className="inner-hero__ornament">AE</div>
        <p className="section-kicker section-kicker--gold">The moments between moments</p>
        <h1>
          Our <em>gallery</em>
        </h1>
        <p className="inner-hero__body">
          A collection of memories, held close and shared with you.
        </p>
        <span className="inner-hero__line" />
      </header>

      <section className="album-selector paper-section">
        <button
          className={album === 'pre' ? 'active' : ''}
          onClick={() => setAlbum('pre')}
          type="button"
        >
          <span>01</span>Pre-wedding<small>Available now</small>
        </button>
        <button
          className={album === 'guest' ? 'active' : ''}
          onClick={() => setAlbum('guest')}
          type="button"
        >
          <span>02</span>Guest moments<small>Opens on the day</small>
        </button>
        <button
          className={album === 'wedding' ? 'active' : ''}
          onClick={() => setAlbum('wedding')}
          type="button"
        >
          <span>03</span>Wedding day<small>Coming soon</small>
        </button>
      </section>

      {album === 'pre' ? (
        <section className="album-grid paper-section">
          {galleryPhotos.map((photo, index) => (
            <Link href="/gallery/pre-wedding" key={photo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Pre-wedding portrait ${index + 1}`}
                width={600}
                height={800}
                loading="lazy"
              />
              <span>View</span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="locked-album paper-section">
          <div className="locked-seal">AE</div>
          <p className="section-kicker">A little more patience</p>
          <h2>
            {album === 'guest' ? 'Your view of our day.' : 'The chapter we’re about to write.'}
          </h2>
          <p>
            {album === 'guest'
              ? 'Guest uploads will open on 19 December. Scan the table card to share your moments.'
              : 'Our wedding photographs will be available after the celebration.'}
          </p>
          {album === 'guest' && (
            <Link className="button button--magenta" href="/upload/wedding-day">
              Preview guest upload
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
