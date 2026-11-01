'use client';

import { useEffect, useRef, useState } from 'react';
import { Monogram } from './Monogram';
import Image from 'next/image';
import { SITE } from '@/content/site.config';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function EnvelopeIntro() {
  const [showEnvelope, setShowEnvelope] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const seen = sessionStorage.getItem('invitation-opened');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!seen && !reduceMotion) {
          setShowEnvelope(true);
        }
      } catch {
        // In case sessionStorage is blocked by browser security
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const skipButtonRef = useRef<HTMLButtonElement>(null);

  const closeEnvelope = () => {
    try {
      sessionStorage.setItem('invitation-opened', 'true');
    } catch {
      // In case sessionStorage is blocked
    }
    setShowEnvelope(false);
  };

  useEffect(() => {
    if (!showEnvelope) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape') {
        e.preventDefault();
        closeEnvelope();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showEnvelope]);

  if (!showEnvelope) return null;

  return (
    <div
      className="envelope-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Open invitation"
      data-testid="opening-sequence"
      tabIndex={-1}
    >
      <button ref={skipButtonRef} className="skip-button" onClick={closeEnvelope} type="button">
        Skip introduction
      </button>
      <div className="envelope">
        <div className="envelope-flap" />
        <div className="envelope-card">
          {/* <Monogram compact /> */}
          <Image
            src={SITE.brand.logo.src}
            alt="Couple Logo"
            width={100}
            height={100}
            className="h-auto w-[60px] object-cover md:w-[100px]"
          />
          <p>We invite you to celebrate with us</p>
        </div>
        <button
          className="wax-seal"
          onClick={closeEnvelope}
          aria-label="Open invitation"
          type="button"
        >
          <Image src={SITE.brand.logo.src} alt="Couple Logo" width={80} height={80} />
        </button>
      </div>
      <button className="open-prompt" onClick={closeEnvelope} type="button">
        Open our invitation <ArrowIcon />
      </button>
    </div>
  );
}
