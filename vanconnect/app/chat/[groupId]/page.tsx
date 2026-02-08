'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ChatGroupRedirect() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string | undefined;

  useEffect(() => {
    if (groupId) {
      router.replace(`/chat?groupId=${groupId}`);
    } else {
      router.replace('/chat');
    }
  }, [groupId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--muted)]">
      Redirecting to chat…
    </div>
  );
}
