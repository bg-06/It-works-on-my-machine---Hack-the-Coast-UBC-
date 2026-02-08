'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipe } from '@/hooks/useSwipe';
import { useAuth } from '@/hooks/useAuth';

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
  const [selectedGoal, setSelectedGoal] = useState('study');
  const { currentLocation, hasMore, loading, swipe, liked } = useSwipe(selectedGoal);
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  /* ---- Drag / swipe gesture state ---- */
  const cardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 120; // px needed to trigger a swipe

  const handleSwipe = useCallback(async (decision: 'like' | 'pass') => {
    if (!currentLocation || swiping) return;

    setSwiping(true);
    setDragOffset({ x: 0, y: 0 });
    setDirection(decision === 'like' ? 'right' : 'left');

    setTimeout(async () => {
      await swipe(currentLocation.id, decision);
      setSwiping(false);
      setDirection(null);
    }, 300);
  }, [currentLocation, swiping, swipe]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (swiping || expanded) return;
    dragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [swiping, expanded]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = (e.clientY - startY.current) * 0.3; // dampen vertical movement
    setDragOffset({ x: dx, y: dy });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    if (dragOffset.x > SWIPE_THRESHOLD) {
      handleSwipe('like');
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      handleSwipe('pass');
    }
    setDragOffset({ x: 0, y: 0 });
  }, [dragOffset.x, handleSwipe]);

  // Derived values for card transform during drag
  const dragRotation = dragOffset.x * 0.08; // slight rotation
  const dragOpacity = Math.max(0, 1 - Math.abs(dragOffset.x) / 500);
  const dragStyle = dragging.current || (dragOffset.x !== 0)
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragRotation}deg)`,
        transition: dragging.current ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        opacity: dragOpacity,
      }
    : undefined;

  useEffect(() => {
    const loadPrefGoal = async () => {
      try {
        const raw = localStorage.getItem('vc_user');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const userId = parsed.userId ?? parsed._id ?? parsed.id;
        if (!userId) return;
        const res = await fetch(`/api/preferences/get?userId=${userId}`);
        if (!res.ok) return;
        const pref = await res.json();
        if (pref?.activity) {
          const goal = String(pref.activity).toLowerCase();
          const allowed = ['hiking', 'photography', 'social', 'study', 'fitness'];
          if (allowed.includes(goal)) {
            setSelectedGoal(goal);
          }
        }
      } catch {}
    };
    loadPrefGoal();
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [currentLocation?.id]);

  const applyTheme = (next: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', next);
    document.body?.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
  };

  useEffect(() => {
    const stored = localStorage.getItem('vc_theme');
    let initial: 'light' | 'dark';
    if (stored === 'light' || stored === 'dark') {
      initial = stored;
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      initial = prefersDark ? 'dark' : 'light';
    }
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('vc_theme', next);
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
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Nav */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex items-center gap-3 justify-self-start">
              <img src="/logo.png" alt="VanConnect" className="h-8 w-auto" />
              <span className="text-lg font-semibold text-[var(--foreground)]">VanConnect</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight justify-self-center text-center">
              Discover Spots
            </h1>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-[var(--border)] bg-white/70 text-[var(--foreground)] shadow-sm hover:bg-[var(--background)]"
              aria-label="Toggle light and dark mode"
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m9.9 9.9 1.414 1.414" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>

          {/* Category filter buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['hiking', 'photography', 'social', 'study', 'fitness'].map((goal) => {
              const active = selectedGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {goal}
                </button>
              );
            })}
          </div>

          {/* Empty state message */}
          <div className="mt-6 flex min-h-[70vh] items-center justify-center">
            <div className="max-w-md w-full bg-[var(--card)] rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {liked.length > 0 ? `You liked ${liked.length} spot${liked.length > 1 ? 's' : ''}!` : `No more ${selectedGoal} spots`}
              </h2>
              <p className="text-[var(--muted)] mb-6">
                {liked.length > 0
                  ? "We'll match you with others who liked the same places."
                  : 'Try switching to a different category or check back later.'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-[var(--primary)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--primary-hover)] transition"
              >
                Back to Home
              </button>
            </div>
          </div>
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
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-3 justify-self-start">
            <img src="/logo.png" alt="VanConnect" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-[var(--foreground)]">VanConnect</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight justify-self-center text-center">
            Discover Spots
          </h1>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-[var(--border)] bg-white/70 text-[var(--foreground)] shadow-sm hover:bg-[var(--background)]"
            aria-label="Toggle light and dark mode"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m9.9 9.9 1.414 1.414" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['hiking', 'photography', 'social', 'study', 'fitness'].map((goal) => {
            const active = selectedGoal === goal;
            return (
              <button
                key={goal}
                type="button"
                onClick={() => setSelectedGoal(goal)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="relative w-full max-w-2xl">
              {/* Card */}
              <div
                ref={cardRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={direction ? undefined : dragStyle}
                className={`rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-xl transition-all duration-300 select-none touch-none ${
                  direction === 'left' ? '-translate-x-full opacity-0' : ''
                } ${direction === 'right' ? 'translate-x-full opacity-0' : ''}`}
              >
                {/* Swipe overlay indicators */}
                {dragOffset.x > 30 && !direction && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-emerald-500/15">
                    <span className="rounded-xl border-4 border-emerald-500 px-6 py-3 text-4xl font-black uppercase tracking-widest text-emerald-500 rotate-[-15deg]">
                      LIKE
                    </span>
                  </div>
                )}
                {dragOffset.x < -30 && !direction && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-rose-500/15">
                    <span className="rounded-xl border-4 border-rose-500 px-6 py-3 text-4xl font-black uppercase tracking-widest text-rose-500 rotate-[15deg]">
                      NOPE
                    </span>
                  </div>
                )}
                {/* Hero area */}
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="relative h-[520px] w-full overflow-hidden rounded-t-3xl bg-[var(--background)]"
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
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  onClick={() => handleSwipe('pass')}
                  disabled={swiping}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/40 text-rose-300 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-black/50 disabled:opacity-50"
                  aria-label="Pass"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSwipe('like')}
                  disabled={swiping}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_20px_50px_rgba(14,124,111,0.45)] transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  aria-label="Like"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-black/50"
                  aria-label="Share"
                >
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="6" cy="12" r="2" />
                    <circle cx="18" cy="6" r="2" />
                    <circle cx="18" cy="18" r="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l8-4M8 13l8 4" />
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
