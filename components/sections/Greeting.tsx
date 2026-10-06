'use client';

import { useEffect, useState } from 'react';
import type { GuestSession } from '@/lib/validation/session';
import { GuestSessionResponseSchema } from '@/lib/validation/session';

export function Greeting() {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetch('/api/session/guest', { cache: 'no-store' })
      .then(async (response) => GuestSessionResponseSchema.safeParse(await response.json()))
      .then((result) => {
        if (active && result.success) setGreeting(result.data.data.guest?.greeting ?? null);
      })
      .catch(() => {
        // Personalisation is optional; the invitation remains fully useful without it.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <p
      aria-live="polite"
      className="min-h-6 text-center font-display text-xl text-magenta-600 sm:text-2xl"
    >
      {greeting}
    </p>
  );
}

export type { GuestSession };
