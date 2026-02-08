'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Simple auth guard – reads `vc_user` from localStorage.
 * If no user is found, redirects to `/` (login page).
 * Returns `{ userId, user, checking }` so pages can show
 * a loading state while the check runs.
 */
export function useAuth() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vc_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const id = parsed.userId ?? parsed._id ?? parsed.id ?? null;
        if (id) {
          setUserId(id);
          setUser(parsed);
          setChecking(false);
          return;
        }
      }
    } catch {}

    // Not authenticated → redirect to login
    router.replace('/');
  }, [router]);

  return { userId, user, checking };
}
