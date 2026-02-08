'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationCard, SwipeDecision } from '@/types';

export function useSwipe() {
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<LocationCard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  /* ---- read userId from localStorage ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vc_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUserId(parsed.userId ?? parsed._id ?? parsed.id ?? null);
      }
    } catch {}
  }, []);

  /* ---- fetch all locations, filter out already-swiped ---- */
  useEffect(() => {
    if (fetchedRef.current) return;
    // Don't fetch until we have a userId
    if (!userId) return;
    fetchedRef.current = true;

    const fetchFeed = async () => {
      try {
        // 1. Get all locations
        const locRes = await fetch('/api/location/all');
        const allLocations: any[] = locRes.ok ? await locRes.json() : [];

        // 2. Get already-swiped locationIds for this user
        let swipedIds: string[] = [];

        const swipeRes = await fetch(`/api/swipe?userId=${userId}`);
        if (swipeRes.ok) {
          const data = await swipeRes.json();
          swipedIds = data.swipedLocationIds ?? [];
        }

        // 3. Filter out already-swiped locations
        const swipedSet = new Set(swipedIds);
        const unswiped = allLocations.filter(
          (l: any) => !swipedSet.has(l._id ?? l.id),
        );

        const mapped: LocationCard[] = unswiped.map((l: any) => ({
          id: l._id ?? l.id ?? crypto.randomUUID(),
          name: l.name ?? 'Unknown Location',
          type: l.type ?? '',
          sustainabilityScore: l.sustainabilityScore ?? 0,
          indoorOutdoor: l.indoorOutdoor ?? 'both',
          images: l.images ?? [],
        }));

        setLocations(mapped);
      } catch {
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [userId]);

  const currentLocation = locations[index] ?? null;
  const hasMore = index < locations.length;

  /* ---- perform a swipe ---- */
  const swipe = useCallback(
    async (
      locationId: string,
      decision: SwipeDecision,
    ): Promise<string | null> => {
      const loc = locations.find(l => l.id === locationId);

      if (decision === 'like' && loc) {
        setLiked(prev => [...prev, loc]);
      }

      // Persist the swipe to the backend (only if authenticated)
      if (userId) {
        try {
          await fetch('/api/swipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              locationId,
              liked: decision === 'like',
            }),
          });
        } catch {}
      }

      // Advance to next card
      setIndex(prev => prev + 1);
      return null;
    },
    [locations, userId],
  );

  return { currentLocation, hasMore, loading, swipe, liked };
}
