import { SITE } from '@/content/site.config';
import Image from 'next/image';
import Link from 'next/link';

export function PageMark({ light = false }: { light?: boolean }) {
  return (
    <Link className={` `} href="/" aria-label="Home - Adetolani & Emmanuel">
      <Image src={SITE.brand.logo.src} alt="Couple Logo" width={46} height={46} />
    </Link>
  );
}
