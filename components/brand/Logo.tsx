import type { ComponentProps } from 'react';
import { SITE } from '@/content/site.config';

export interface LogoProps extends Omit<ComponentProps<'img'>, 'src'> {
  size?: number;
  variant?: 'gold' | 'light';
  className?: string;
}

export function Logo({
  size = 48,
  variant = 'gold',
  className = '',
  alt = `${SITE.couple.initials} Monogram`,
  ...props
}: LogoProps) {
  const { src, width, height } = SITE.brand.logo;

  return (
    // Plain <img> per architecture §3.4: next/image blocks inline SVG by default
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size || width}
      height={size || height}
      className={`inline-block ${variant === 'light' ? 'brightness-125' : ''} ${className}`}
      {...props}
    />
  );
}
