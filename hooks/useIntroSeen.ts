'use client';

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'wedding_intro';

function readIntroSeen(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useIntroSeen() {
  const [hasSeen, setHasSeen] = useState<boolean>(readIntroSeen);

  const markSeen = useCallback(() => {
    setHasSeen(true);

    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // sessionStorage is optional; the intro should behave gracefully when unavailable.
    }
  }, []);

  return { hasSeen, markSeen };
}
