'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipe } from '@/hooks/useSwipe';

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
  const { currentLocation, hasMore, loading, swipe, liked } = useSwipe();
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = async (decision: 'like' | 'pass') => {
    if (!currentLocation || swiping) return;

    setSwiping(true);
    setDirection(decision === 'like' ? 'right' : 'left');

    setTimeout(async () => {
      await swipe(currentLocation.id, decision);
      setSwiping(false);
      setDirection(null);
    }, 300);
  };

  /* ---- Loading ---- */
  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#056661] to-[#1b7e57] p-4">
      <div className="max-w-md mx-auto py-8">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white text-center">Discover Spots</h1>
          <div className="w-6" />
        </div>

        <div className="relative">
          {/* Card */}
          <div
            className={`bg-[var(--card)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              direction === 'left' ? '-translate-x-full opacity-0' : ''
            } ${direction === 'right' ? 'translate-x-full opacity-0' : ''}`}
          >
            {/* Hero area */}
            <div className="relative h-64 bg-gradient-to-br from-[#056661] to-[#1b7e57] flex items-center justify-center">
              {currentLocation.images.length > 0 ? (
                <img
                  src={currentLocation.images[0]}
                  alt={currentLocation.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="text-7xl">{emoji}</span>
              )}
              {/* Type badge */}
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {currentLocation.type || 'Spot'}
              </div>
              {/* Indoor/outdoor badge */}
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {currentLocation.indoorOutdoor}
              </div>
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {currentLocation.name}
              </h2>

              <SustainabilityBadge score={currentLocation.sustainabilityScore} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={() => handleSwipe('pass')}
              disabled={swiping}
              className="bg-red-500 text-white p-6 rounded-full shadow-lg hover:bg-red-600 transition-all disabled:opacity-50 hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={() => handleSwipe('like')}
              disabled={swiping}
              className="bg-green-500 text-white p-6 rounded-full shadow-lg hover:bg-green-600 transition-all disabled:opacity-50 hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
