'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const GOALS = [
  {
    value: 'study' as const,
    label: 'Find Study Buddies',
    desc: 'Connect with classmates in Vancouver libraries and campus hubs.',
    icon: '📚',
    bgColor: 'bg-teal-50',
  },
  {
    value: 'sustainable' as const,
    label: 'Explore Sustainable Spots',
    desc: 'Discover eco-friendly cafés, shops, and zero-waste locations.',
    icon: '♻️',
    bgColor: 'bg-green-50',
  },
  {
    value: 'outdoors' as const,
    label: 'Join Outdoor Adventures',
    desc: 'Find groups for hiking the North Shore or biking the Seawall.',
    icon: '🏔️',
    bgColor: 'bg-orange-50',
  },
];

const TRANSPORTS = [
  { value: 'transit' as const,  label: 'Skytrain / Bus', icon: '🚇' },
  { value: 'biking' as const,   label: 'Biking',         icon: '🚲' },
  { value: 'walking' as const,  label: 'Walking',        icon: '🚶' },
  { value: 'carpool' as const,  label: 'Carpool',        icon: '🚗' },
];

const INTERESTS = [
  { label: 'Coffee',        icon: '☕' },
  { label: 'Hiking',        icon: '🥾' },
  { label: 'Coding',        icon: '💻' },
  { label: 'Photography',   icon: '📷' },
  { label: 'Nightlife',     icon: '🌃' },
  { label: 'Study Groups',  icon: '📖' },
  { label: 'Music',         icon: '🎧' },
  { label: 'Foodie',        icon: '🍜' },
];

type Goal      = (typeof GOALS)[number]['value'];
type Transport = (typeof TRANSPORTS)[number]['value'];
type Energy    = 'chill' | 'balanced' | 'active';

const ENERGY_MAP: Record<number, Energy> = { 0: 'chill', 1: 'balanced', 2: 'active' };
const ENERGY_LABELS = [
  { label: 'Chill 😌',     pos: 'text-left' },
  { label: 'Balanced 🧘',  pos: 'text-center' },
  { label: 'Active 🏃',    pos: 'text-right' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();

  // Auth guard – redirect to login if not authenticated
  const [vcUser, setVcUser] = useState<{ userId?: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vc_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const id = parsed.userId ?? parsed._id ?? parsed.id;
        if (id) {
          setVcUser(parsed);
          setAuthChecked(true);
          return;
        }
      }
    } catch {}
    router.replace('/');
  }, [router]);
  const userName = vcUser?.name ?? '';
  const userPhoto = '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // form state
  const [goal, setGoal]           = useState<Goal | ''>('');
  const [transport, setTransport] = useState<Transport | ''>('');
  const [energyIdx, setEnergyIdx] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);

  const energy = ENERGY_MAP[energyIdx];

  const toggleInterest = (label: string) =>
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label],
    );

  const canAdvance =
    (step === 1 && goal !== '') ||
    (step === 2 && transport !== '') ||
    (step === 3 && interests.length > 0);

  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => setStep(s => Math.max(s - 1, 1));

  /* ---- submit ---- */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body = {
        userId: vcUser?.userId ?? 'guest',
        goal,
        transport,
        energy,
        interests,
        // map into the fields the backend schema expects
        activity:       goal,
        energyLevel:    energy,
        vibe:           energy,
        indoorOutdoor:  goal === 'outdoors' ? 'outdoor' as const : 'both' as const,
        availability:   [] as string[],
        sustainability: transport === 'transit' || transport === 'biking' ? transport : 'low',
      };
      const res = await fetch('/api/preferences/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Mark user as onboarded
        await fetch('/api/user/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: vcUser?.userId ?? 'guest' }),
        });
        // Update localStorage so future logins skip onboarding
        const stored = JSON.parse(localStorage.getItem('vc_user') || '{}');
        stored.onboarded = true;
        localStorage.setItem('vc_user', JSON.stringify(stored));
        router.push('/swipe');
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---- progress ---- */
  const pct = Math.round((step / 3) * 100);

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-2xl text-[var(--muted)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* -------- Top Nav -------- */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-[rgb(12,18,16)]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VanConnect" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/swipe')}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            Skip for now
          </button>
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="avatar"
              className="w-10 h-10 rounded-full border-2 border-white/40 shadow-sm object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              {userName.charAt(0)}
            </div>
          )}
        </div>
      </header>

      {/* -------- Main -------- */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* ===== STEP 1 ===== */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-2 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  Welcome to VanConnect, {userName}!
                </h1>
                <p className="text-lg text-[var(--muted)] max-w-2xl">
                  To personalise your experience, tell us what you&apos;re primarily looking for today.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {GOALS.map(g => {
                  const selected = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`
                        relative flex flex-col gap-4 p-6 rounded-xl border-2 text-left
                        transition-all duration-200 cursor-pointer
                        ${selected
                          ? 'border-[var(--primary)] bg-teal-50/60 shadow-lg'
                          : 'border-transparent bg-[var(--card)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/40'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-14 h-14 rounded-full ${g.bgColor} flex items-center justify-center text-2xl`}>
                          {g.icon}
                        </div>
                        {selected && (
                          <span className="text-[var(--primary)] text-xl">✓</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold">{g.label}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">{g.desc}</p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ===== STEP 2 ===== */}
          {step === 2 && (
            <div className="w-full max-w-2xl mx-auto bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
              <div className="px-8 py-6 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  How do you usually get around?
                </h1>
                <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                  We&apos;ll use this to calculate your potential carbon savings and customise your dashboard.
                </p>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {TRANSPORTS.map(t => {
                    const selected = transport === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTransport(t.value)}
                        className={`
                          relative p-6 flex flex-col items-center justify-center gap-3
                          rounded-xl border-2 transition-all duration-200 cursor-pointer
                          ${selected
                            ? 'border-[var(--primary)] bg-teal-50/50'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-teal-50/30'
                          }
                        `}
                      >
                        <span className="text-4xl">{t.icon}</span>
                        <span className="font-semibold text-lg">{t.label}</span>
                        {selected && (
                          <span className="absolute top-3 right-3 text-[var(--primary)] text-lg">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="w-full flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-4">
                  <span className="text-lg">🌱</span>
                  <p className="text-sm font-medium text-green-800">
                    Tip: Choosing transit helps us track your carbon savings!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3 ===== */}
          {step === 3 && (
            <div className="w-full max-w-2xl mx-auto bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
              <div className="px-8 py-6 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  What&apos;s your vibe?
                </h1>
                <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                  Help us find the right crowd for you in Vancouver.
                </p>

                {/* ---- Energy slider ---- */}
                <div className="w-full bg-[var(--background)] rounded-xl p-6 mb-8 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Energy Level</h2>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full bg-teal-50 text-[var(--primary)] capitalize">
                      {energy}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    value={energyIdx}
                    onChange={e => setEnergyIdx(Number(e.target.value))}
                    className="energy-slider w-full"
                    style={{ '--val': `${energyIdx * 50}%` } as React.CSSProperties}
                  />

                  <div className="flex justify-between mt-2 text-sm text-[var(--muted)]">
                    {ENERGY_LABELS.map((el, i) => (
                      <span key={i} className={el.pos}>{el.label}</span>
                    ))}
                  </div>
                </div>

                {/* ---- Interests ---- */}
                <div className="w-full text-left mb-6">
                  <h2 className="text-lg font-bold mb-4">Interests</h2>
                  <div className="flex flex-wrap gap-3">
                    {INTERESTS.map(item => {
                      const selected = interests.includes(item.label);
                      return (
                        <button
                          key={item.label}
                          onClick={() => toggleInterest(item.label)}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-full border-2
                            font-medium text-sm transition-all duration-150
                            ${selected
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                            }
                          `}
                        >
                          <span>{item.icon}</span>
                          {item.label}
                          {selected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------- Footer / progress -------- */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-[var(--border)]">
            {/* progress */}
            <div className="flex flex-col gap-2 w-full md:w-64">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
                  Step {step} of 3
                </span>
                <span className="text-sm font-medium text-[var(--muted)]">
                  {step === 3 ? 'Final Step' : `${pct}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-4 w-full md:w-auto">
              {step > 1 && (
                <button
                  onClick={back}
                  className="px-6 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={next}
                  disabled={!canAdvance}
                  className="
                    flex-1 md:flex-none min-w-[140px] h-12 flex items-center justify-center gap-2
                    bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold
                    rounded-lg px-8 transition-colors shadow-md hover:shadow-lg
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  Next <span className="text-lg">→</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canAdvance || loading}
                  className="
                    flex-1 md:flex-none min-w-[180px] h-12 flex items-center justify-center gap-2
                    bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold
                    rounded-lg px-8 transition-colors shadow-md hover:shadow-lg
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  {loading ? 'Saving…' : 'Start Connecting →'}
                </button>
              )}
            </div>
          </div>

          {/* skip link on mobile */}
          <button
            onClick={() => router.push('/swipe')}
            className="text-sm text-[var(--muted)] underline self-center sm:hidden"
          >
            Skip for now
          </button>
        </div>
      </main>
    </div>
  );
}
