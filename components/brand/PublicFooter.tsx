import Link from 'next/link';
import { PageMark } from './PageMark';

export function PublicFooter() {
  return (
    <footer className="page-footer">
      <PageMark light />
      <div>
        <strong>Adetolani &amp; Abiodun</strong>
        <span>19 December 2026 · Ilorin</span>
      </div>
      <div className="footer-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/rsvp">Contact us</Link>
      </div>
      <p>#designedToBi&apos;26</p>
    </footer>
  );
}
