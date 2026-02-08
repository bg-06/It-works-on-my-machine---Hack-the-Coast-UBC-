'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipe } from '@/hooks/useSwipe';
import Image from 'next/image';

export default function SwipePage() {
  const router = useRouter();
  const { currentCandidate, hasMore, loading, swipe } = useSwipe();
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = async (decision: 'like' | 'pass') => {
    if (!currentCandidate || swiping) return;

    setSwiping(true);
    setDirection(decision === 'like' ? 'right' : 'left');

    setTimeout(async () => {
      const groupId = await swipe(currentCandidate.id, decision);
      
      if (groupId) {
        router.push(`/match?groupId=${groupId}`);
      } else {
        setSwiping(false);
        setDirection(null);
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600">Loading matches...</div>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No more profiles</h2>
          <p className="text-gray-600 mb-6">Check back later for new connections!</p>
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

  if (!currentCandidate) {
    return null;
  }

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
          <h1 className="text-3xl font-bold text-white text-center">Find Your Match</h1>
          <div className="w-6" /> {/* spacer */}
        </div>

        <div className="relative">
          {/* Card */}
          <div
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              direction === 'left' ? '-translate-x-full opacity-0' : ''
            } ${direction === 'right' ? 'translate-x-full opacity-0' : ''}`}
          >
            {/* Photo */}
            <div className="relative h-96 bg-gradient-to-br from-[#056661] to-[#1b7e57] flex items-center justify-center">
              {currentCandidate.photoUrl ? (
                <Image
                  src={currentCandidate.photoUrl}
                  alt={currentCandidate.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-white text-6xl font-bold">
                  {currentCandidate.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {currentCandidate.name}
              </h2>
              <p className="text-gray-600 mb-4">{currentCandidate.year}</p>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Vibe:</span>
                  <span className="ml-2 text-[var(--primary)] font-medium">{currentCandidate.vibe}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Energy:</span>
                  <span className="ml-2 text-[var(--accent)] font-medium">{currentCandidate.energy}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentCandidate.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
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
