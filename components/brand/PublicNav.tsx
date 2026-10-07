'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageMark } from './PageMark';

export interface PublicNavProps {
  dark?: boolean;
}

export function PublicNav({ dark = false }: PublicNavProps) {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname?.startsWith('/i/');

  if (isHome) {
    return (
      <nav className="top-nav" aria-label="Primary">
        <Link href="/" className="nav-mark" aria-label="Adetolani and Emmanuel Home">
          A <span>&amp;</span> E
          <p style={{ textTransform: 'none' }} className="-mt-2 text-[10px] ">
            #designedToBi&apos;26
          </p>
        </Link>
        <div className="nav-links">
          <Link href="#story">Our story</Link>
          <Link href="#events">The details</Link>
          <Link href="#venue">Venue</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/gift">Gifts</Link>
        </div>
        <Link href="/rsvp" className="nav-rsvp">
          RSVP
        </Link>
      </nav>
    );
  }

  return (
    <nav className={`page-nav ${dark ? 'page-nav--dark' : ''}`} aria-label="Primary navigation">
      <PageMark light={dark} />
      <div>
        <Link href="/">Home</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/gift">Gifts</Link>
        <Link href="/rsvp">RSVP</Link>
      </div>
    </nav>
  );
}
