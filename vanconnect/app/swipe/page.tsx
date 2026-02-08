'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipe } from '@/hooks/useSwipe';
import { useAuth } from '@/hooks/useAuth';

/* helper: render sustainability dots (out of 10) */
function SustainabilityBadge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(10, score));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-[var(--primary)]">♻️ {clamped}/10</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < clamped ? 'bg-[var(--primary)]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* type → emoji mapping */
const TYPE_EMOJI: Record<string, string> = {
  cafe: '☕',
  park: '🌳',
  trail: '🥾',
  study: '📚',
  outdoor: '🏔️',
  social: '🎉',
};

export default function SwipePage() {
  const router = useRouter();
  const { checking } = useAuth();
  const { currentLocation, hasMore, loading, swipe, liked } = useSwipe();
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [currentLocation?.id]);

  const handleSwipe = async (decision: 'like' | 'pass') => {
    if (!currentLocation || swiping) return;

    setSwiping(true);
    setDirection(decision === 'like' ? 'right' : 'left');

    setTimeout(async () => {
      const groupId = await swipe(currentLocation.id, decision);
      setSwiping(false);
      setDirection(null);

      // If a match was found, redirect to the match celebration page
      if (groupId) {
        router.push(`/match?groupId=${groupId}`);
      }
    }, 300);
  };

  /* ---- Loading ---- */
  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-2xl text-[var(--muted)]">Loading locations…</div>
      </div>
    );
  }

  /* ---- Done / empty ---- */
  if (!hasMore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4">
        <div className="max-w-md w-full bg-[var(--card)] rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {liked.length > 0 ? `You liked ${liked.length} spot${liked.length > 1 ? 's' : ''}!` : 'No locations yet'}
          </h2>
          <p className="text-[var(--muted)] mb-6">
            {liked.length > 0
              ? "We'll match you with others who liked the same places."
              : 'Check back later — new spots are added all the time.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-[var(--primary)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--primary-hover)] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }


  if (!currentLocation) return null;

  const emoji = TYPE_EMOJI[currentLocation.type.toLowerCase()] ?? '📍';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Nav */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="w-6" />
          <h1 className="text-3xl font-semibold tracking-tight">Discover Spots</h1>
          <div className="w-6" />
        </div>

        <div className="mt-8">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="relative w-full max-w-2xl">
              {/* Card */}
              <div
                className={`rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-xl transition-all duration-300 ${
                  direction === 'left' ? '-translate-x-full opacity-0' : ''
                } ${direction === 'right' ? 'translate-x-full opacity-0' : ''}`}
              >
                {/* Hero area */}
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="relative h-80 w-full overflow-hidden rounded-t-3xl bg-[var(--background)]"
                  aria-expanded={expanded}
                  aria-label="Toggle place details"
                >
                  {currentLocation.images.length > 0 ? (
                    <img
                      src={currentLocation.images[0]}
                      alt={currentLocation.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl">
                      {emoji}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-4 flex justify-center">
                    <span className="rounded-full bg-black/55 px-4 py-1 text-xs font-semibold text-white">
                      {expanded ? 'Hide details' : 'View details'}
                    </span>
                  </div>
                </button>

                {/* Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{currentLocation.name}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {currentLocation.description ?? 'Description coming soon.'}
                    </p>
                    {currentLocation.address && (
                      <p className="mt-1 text-xs text-[var(--muted)]">{currentLocation.address}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1">
                      {currentLocation.type || 'Spot'}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1">
                      {currentLocation.indoorOutdoor}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1">
                      Sustainability {currentLocation.sustainabilityScore ?? 0}/10
                    </span>
                    {typeof currentLocation.rating === 'number' && (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1">
                        Rating {currentLocation.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {currentLocation.tags && currentLocation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      {currentLocation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--border)] bg-white px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                <SustainabilityBadge score={currentLocation.sustainabilityScore} />
              </div>

              {expanded && (
                <div className="border-t border-[var(--border)] p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {currentLocation.images.length > 0 ? (
                      currentLocation.images.map((img, idx) => (
                        <div
                          key={`${img}-${idx}`}
                          className="relative h-24 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]"
                        >
                          <img src={img} alt={`${currentLocation.name} ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-sm text-[var(--muted)]">No additional photos yet.</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Type</div>
                      <div className="text-base font-semibold text-[var(--foreground)]">{currentLocation.type || 'Spot'}</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Indoor/Outdoor</div>
                      <div className="text-base font-semibold text-[var(--foreground)]">{currentLocation.indoorOutdoor}</div>
                    </div>
                    {currentLocation.address && (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 md:col-span-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Address</div>
                        <div className="text-base font-semibold text-[var(--foreground)]">{currentLocation.address}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-6 mt-8">
                <button
                  onClick={() => handleSwipe('pass')}
                  disabled={swiping}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                  aria-label="Pass"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSwipe('like')}
                  disabled={swiping}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  aria-label="Like"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
