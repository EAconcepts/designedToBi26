import type { ComponentProps } from 'react';

export interface LogoProps extends Omit<ComponentProps<'img'>, 'src'> {
  size?: number;
  variant?: 'gold' | 'light';
  className?: string;
  src?: string;
}

export function Logo({
  size = 48,
  variant = 'gold',
  className = '',
  src = '/brand/logo-placeholder.svg',
  alt = 'AE Monogram',
  ...props
}: LogoProps) {
  return (
    // Plain <img> per architecture §3.4: next/image blocks inline SVG by default
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block ${variant === 'light' ? 'brightness-125' : ''} ${className}`}
      {...props}
    />
  );
}
