'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import type { SiteMode } from '@prisma/client';
import { countdownTargetISO } from '@/lib/datetime';

interface CountdownProps {
  mode?: SiteMode;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calculateRemaining(targetIso: string): TimeRemaining {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: false };
}

const emptySubscribe = () => () => {};

export function Countdown({ mode = 'PRE' }: CountdownProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [targetIso] = useState(() => countdownTargetISO());
  const [remaining, setRemaining] = useState<TimeRemaining>(() => calculateRemaining(targetIso));

  useEffect(() => {
    if (mode !== 'PRE') return;

    const interval = setInterval(() => {
      setRemaining(calculateRemaining(targetIso));
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, targetIso]);

  // Mode-driven terminal states take precedence over clock per §3.8
  if (mode === 'LIVE') {
    return (
      <div
        data-testid="countdown-live"
        className="countdown-live inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-magenta-900/60 border border-gold/40 text-light-gold text-xs sm:text-sm tracking-widest uppercase font-serif"
      >
        <span className="w-2 h-2 rounded-full bg-light-gold animate-ping" />
        Today!
      </div>
    );
  }

  if (mode === 'POST') {
    return (
      <div
        data-testid="countdown-post"
        className="countdown-post inline-block text-light-gold text-sm sm:text-base font-serif italic tracking-wide"
      >
        We&apos;re married — 19 Dec 2026
      </div>
    );
  }

  // PRE Mode: Standard countdown
  return (
    <div
      data-testid="countdown-pre"
      className="countdown-timer flex items-center justify-center gap-3 sm:gap-6 text-white max-w-full"
      aria-live="off"
    >
      <div className="flex flex-col items-center">
        <span className="font-serif text-2xl sm:text-3xl font-bold text-light-gold leading-none">
          {isClient ? remaining.days : '72'}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ivory/70 mt-1">
          Days
        </span>
      </div>
      <span className="text-light-gold font-serif text-lg sm:text-xl opacity-60">·</span>
      <div className="flex flex-col items-center">
        <span className="font-serif text-2xl sm:text-3xl font-bold text-light-gold leading-none">
          {isClient ? remaining.hours : '18'}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ivory/70 mt-1">
          Hours
        </span>
      </div>
      <span className="text-light-gold font-serif text-lg sm:text-xl opacity-60">·</span>
      <div className="flex flex-col items-center">
        <span className="font-serif text-2xl sm:text-3xl font-bold text-light-gold leading-none">
          {isClient ? remaining.minutes : '45'}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ivory/70 mt-1">
          Mins
        </span>
      </div>
      <span className="text-light-gold font-serif text-lg sm:text-xl opacity-60">·</span>
      <div className="flex flex-col items-center">
        <span className="font-serif text-2xl sm:text-3xl font-bold text-light-gold leading-none">
          {isClient ? remaining.seconds : '00'}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ivory/70 mt-1">
          Secs
        </span>
      </div>
    </div>
  );
}
