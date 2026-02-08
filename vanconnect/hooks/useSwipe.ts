'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PersonCard, SwipeDecision } from '@/types';

export function useSwipe() {
  const [candidates, setCandidates] = useState<PersonCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  /* ---- fetch the swipe feed ---- */
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/swipe/feed');
        if (res.ok) {
          const data = await res.json();
          const mapped: PersonCard[] = (data.candidates ?? data ?? []).map(
            (c: any) => ({
              id: c._id ?? c.id ?? crypto.randomUUID(),
              name: c.name ?? 'Anonymous',
              year: c.year ?? '',
              tags: c.tags ?? c.interests ?? [],
              vibe: c.vibe ?? c.activity ?? '',
              energy: c.energy ?? c.energyLevel ?? '',
              photoUrl: c.photoUrl ?? c.image ?? undefined,
            }),
          );
          setCandidates(mapped);
        } else {
          // If feed endpoint doesn't exist yet, use demo data so the UI works
          setCandidates(getDemoCandidates());
        }
      } catch {
        // Fallback to demo data so swiping still works
        setCandidates(getDemoCandidates());
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const currentCandidate = candidates[index] ?? null;
  const hasMore = index < candidates.length;

  /* ---- perform a swipe ---- */
  const swipe = useCallback(
    async (
      candidateId: string,
      decision: SwipeDecision,
    ): Promise<string | null> => {
      try {
        // Try the match endpoint when they "like"
        if (decision === 'like') {
          const res = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'guest', targetId: candidateId }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.group?._id) {
              // Move to next card
              setIndex(prev => prev + 1);
              return data.group._id;
            }
          }
        }
      } catch (err) {
        console.error('Swipe error:', err);
      }

      // Advance to next card regardless
      setIndex(prev => prev + 1);
      return null;
    },
    [],
  );

  return { currentCandidate, hasMore, loading, swipe };
}

/* ---- demo candidates so swiping always works visually ---- */
function getDemoCandidates(): PersonCard[] {
  return [
    {
      id: 'demo-1',
      name: 'Alex Chen',
      year: '3rd Year · Computer Science',
      tags: ['Coffee', 'Coding', 'Hiking'],
      vibe: 'Study Buddies',
      energy: 'Balanced',
      photoUrl: undefined,
    },
    {
      id: 'demo-2',
      name: 'Maya Patel',
      year: '2nd Year · Environmental Science',
      tags: ['Hiking', 'Photography', 'Sustainability'],
      vibe: 'Outdoor Adventures',
      energy: 'Active',
      photoUrl: undefined,
    },
    {
      id: 'demo-3',
      name: 'Jordan Lee',
      year: '4th Year · Business',
      tags: ['Foodie', 'Nightlife', 'Music'],
      vibe: 'Social Explorer',
      energy: 'Active',
      photoUrl: undefined,
    },
    {
      id: 'demo-4',
      name: 'Sam Williams',
      year: '1st Year · Arts',
      tags: ['Music', 'Coffee', 'Study Groups'],
      vibe: 'Chill Vibes',
      energy: 'Chill',
      photoUrl: undefined,
    },
    {
      id: 'demo-5',
      name: 'Taylor Kim',
      year: '3rd Year · Kinesiology',
      tags: ['Hiking', 'Biking', 'Photography'],
      vibe: 'Eco Explorer',
      energy: 'Active',
      photoUrl: undefined,
    },
  ];
}
