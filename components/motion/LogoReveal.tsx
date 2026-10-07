'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function LogoReveal({
  src,
  alt,
  size = 104,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const mask =
    'linear-gradient(120deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 48%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)';

  return (
    <div
      className={`relative inline-flex ${className}`}
      style={{ width: size, height: size }}
      suppressHydrationWarning
    >
      <motion.img
        src={src}
        alt={alt}
        width={size}
        height={size}
        initial={false}
        animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 block rounded-full object-contain"
        style={{
          maskImage: reducedMotion ? undefined : mask,
          WebkitMaskImage: reducedMotion ? undefined : mask,
        }}
      />

      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-full"
          style={{
            background:
              'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.35) 20%, rgba(233,196,95,0.95) 40%, rgba(255,255,255,0.35) 62%, transparent 100%)',
            maskImage: mask,
            WebkitMaskImage: mask,
            mixBlendMode: 'screen',
          }}
          initial={false}
          animate={{ x: '120%' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}
