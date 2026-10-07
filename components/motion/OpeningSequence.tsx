'use client';

import { Logo } from '@/components/brand/Logo';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import { useIntroSeen } from '@/hooks/useIntroSeen';

export function OpeningSequence() {
  const reducedMotion = useReducedMotion();
  const { hasSeen, markSeen } = useIntroSeen();

  const skipSequence = useCallback(() => {
    markSeen();
  }, [markSeen]);

  useEffect(() => {
    if (reducedMotion || hasSeen) {
      return;
    }

    const timer = window.setTimeout(() => {
      skipSequence();
    }, 2000);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        skipSequence();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [hasSeen, reducedMotion, skipSequence]);

  if (reducedMotion || hasSeen) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      data-testid="opening-sequence"
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ivory/95 backdrop-blur-sm"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={skipSequence}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative flex flex-col items-center justify-center"
      >
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-gold-500/60 bg-white shadow-[0_0_28px_rgba(201,162,75,0.24)]">
          <div className="absolute inset-3 rounded-full border border-gold-500/40" />
          <div className="absolute -top-2 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full bg-[#d8b865] shadow-[0_0_20px_rgba(216,184,101,0.8)]" />
          <Logo size={72} className="relative z-10" />
        </div>

        <motion.p
          className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-gold-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          With love
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
