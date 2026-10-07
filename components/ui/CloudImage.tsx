import Image, { type ImageProps } from 'next/image';

export interface CloudImageProps extends Omit<ImageProps, 'src'> {
  src?: string;
  publicId?: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  blurDataURL?: string;
  crop?: 'fill' | 'fit' | 'limit' | 'scale';
}

export function CloudImage({
  src: propSrc,
  publicId,
  alt,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className = '',
  blurDataURL,
  priority = false,
  crop = 'fill',
  ...rest
}: CloudImageProps) {
  let resolvedSrc = propSrc || '';

  if (!resolvedSrc && publicId) {
    if (
      publicId.startsWith('http://') ||
      publicId.startsWith('https://') ||
      publicId.startsWith('/')
    ) {
      resolvedSrc = publicId;
    } else {
      resolvedSrc = `https://res.cloudinary.com/dqg4nqqwk/image/upload/f_auto,q_auto,w_${width},h_${height},c_${crop}/${publicId.replace(/^\//, '')}`;
    }
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      placeholder={blurDataURL ? 'blur' : undefined}
      blurDataURL={blurDataURL}
      className={`transition-opacity duration-300 ${className}`}
      {...rest}
    />
  );
}
