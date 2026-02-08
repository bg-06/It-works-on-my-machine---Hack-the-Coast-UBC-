'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function MatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  useEffect(() => {
    if (!groupId) {
      router.push('/swipe');
      return;
    }

    // Auto-redirect to event page after celebration
    const timer = setTimeout(() => {
      router.push(`/event/${groupId}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [groupId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#056661] to-[#1b7e57] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">It&apos;s a Match!</h1>
          <p className="text-gray-600 text-lg">
            You&apos;ve connected with someone awesome!
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <button
            onClick={() => router.push(`/event/${groupId}`)}
            className="w-full bg-[var(--primary)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--primary-hover)] transition-all shadow-md"
          >
            🌿 View Your Event
          </button>
          <button
            onClick={() => router.push(`/chat/${groupId}`)}
            className="w-full bg-white border-2 border-[var(--primary)] text-[var(--primary)] font-semibold py-3 px-6 rounded-lg hover:bg-teal-50 transition-all"
          >
            💬 Start Chatting
          </button>
        </div>

        <div className="text-sm text-gray-500 mt-8">
          Taking you to your event details...
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#056661] to-[#1b7e57]">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      }
    >
      <MatchContent />
    </Suspense>
  );
}
