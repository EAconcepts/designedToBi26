import Link from 'next/link';

export function PageMark({ light = false }: { light?: boolean }) {
  return (
    <Link
      className={`page-mark ${light ? 'page-mark--light' : ''}`}
      href="/"
      aria-label="Home - Adetolani & Emmanuel"
    >
      AE
    </Link>
  );
}
