'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { GuestSessionResponseSchema, type GuestSession } from '@/lib/validation/session';

type RsvpPrefillContextValue = {
  guest: GuestSession | null;
  loading: boolean;
  error: boolean;
};

const RsvpPrefillContext = createContext<RsvpPrefillContextValue | null>(null);

export function RsvpPrefillProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/session/guest', { cache: 'no-store' })
      .then(async (response) => {
        const result = GuestSessionResponseSchema.safeParse(await response.json());
        if (!result.success) throw new Error('Invalid guest session response');
        return result.data.data.guest;
      })
      .then((value) => {
        if (active) setGuest(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ guest, loading, error }), [guest, loading, error]);
  return <RsvpPrefillContext.Provider value={value}>{children}</RsvpPrefillContext.Provider>;
}

export function useRsvpPrefill(): RsvpPrefillContextValue {
  const value = useContext(RsvpPrefillContext);
  if (!value) throw new Error('useRsvpPrefill must be used within RsvpPrefillProvider');
  return value;
}
