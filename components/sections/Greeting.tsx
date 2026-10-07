'use client';

import { useEffect, useState } from 'react';
import type { GuestSession } from '@/lib/validation/session';
export function Greeting({
  defaultGreeting = 'Dear family & friends',
}: {
  defaultGreeting?: string;
}) {
  const [greeting, setGreeting] = useState<string>(defaultGreeting);

  useEffect(() => {
    let active = true;

    void fetch('/api/session/guest', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((json: unknown) => {
        const payload = json as { data?: { guest?: { greeting?: string } } } | null;
        if (
          active &&
          payload?.data?.guest?.greeting &&
          typeof payload.data.guest.greeting === 'string'
        ) {
          setGreeting(payload.data.guest.greeting);
        }
      })
      .catch(() => {
        // Personalisation is optional; default remains active
      });

    return () => {
      active = false;
    };
  }, [defaultGreeting]);

  return <span aria-live="polite">{greeting}</span>;
}

export type { GuestSession };
