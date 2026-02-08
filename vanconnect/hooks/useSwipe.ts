'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationCard, SwipeDecision } from '@/types';
import { uid } from '@/lib/uid';

const GOAL_TYPE_MAP: Record<string, string[]> = {
  hiking: ['trail', 'outdoor', 'park'],
  photography: ['park', 'outdoor', 'trail', 'cafe'],
  social: ['social', 'cafe'],
  study: ['study', 'cafe'],
  fitness: ['trail', 'outdoor', 'park'],
};

export function useSwipe(goal?: string) {
  const [allLocations, setAllLocations] = useState<LocationCard[]>([]);
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<LocationCard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  // Track IDs swiped during this session so they stay hidden across category changes
  const [swipedSessionIds, setSwipedSessionIds] = useState<Set<string>>(new Set());

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
          id: l._id ?? l.id ?? uid(),
          name: l.name ?? 'Unknown Location',
          type: l.type ?? '',
          description: l.description ?? '',
          address: l.address ?? '',
          rating: l.rating,
          tags: l.tags ?? [],
          sustainabilityScore: l.sustainabilityScore ?? 0,
          indoorOutdoor: l.indoorOutdoor ?? 'both',
          images: l.images ?? [],
        }));

        setAllLocations(mapped);
      } catch {
        setAllLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [userId]);

  useEffect(() => {
    const normalizedGoal = goal?.toLowerCase().trim();

    // Start from all locations, then remove anything swiped this session
    const unswiped = allLocations.filter((loc) => !swipedSessionIds.has(loc.id));

    if (!normalizedGoal) {
      setLocations(unswiped);
      setIndex(0);
      return;
    }
    const allowed = GOAL_TYPE_MAP[normalizedGoal] ?? [];
    if (allowed.length === 0) {
      setLocations(unswiped);
      setIndex(0);
      return;
    }
    const filtered = unswiped.filter((loc) =>
      allowed.includes((loc.type ?? '').toLowerCase())
    );
    setLocations(filtered);
    setIndex(0);
  }, [allLocations, goal, swipedSessionIds]);

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

      // Mark this location as swiped for the current session
      setSwipedSessionIds(prev => {
        const next = new Set(prev);
        next.add(locationId);
        return next;
      });

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

      let matchedGroupId: string | null = null;

      if (userId && decision === 'like') {
        try {
          const res = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, activity: goal }),
          });
          if (res.ok) {
            const data = await res.json();
            const group = data?.group ?? null;
            const memberCount = Array.isArray(group?.members) ? group.members.length : 0;
            const isRealMatch = (data?.matchFound as boolean | undefined) ?? memberCount >= 2;
            const resolvedId = group?._id ?? group?.id ?? null;
            // Only treat it as a "match" when at least 2 people are in the group
            matchedGroupId = isRealMatch ? resolvedId : null;
          }
        } catch {}
      }

      // Advance to next card
      setIndex(prev => prev + 1);
      return matchedGroupId;
    },
    [locations, userId, goal],
  );

  return { currentLocation, hasMore, loading, swipe, liked };
}
