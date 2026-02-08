'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function MatchPage() {
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">It's a Match!</h1>
          <p className="text-gray-600 text-lg">
            You've connected with someone awesome!
          </p>
        </div>

        <div className="text-sm text-gray-500 mt-8">
          Taking you to your event details...
        </div>
      </div>
    </div>
  );
}
