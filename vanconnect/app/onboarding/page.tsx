'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

const ENERGY_OPTIONS = [
  { value: 'chill', label: 'Chill' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'active', label: 'Active' },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: 'quiet', label: 'Quiet / focused' },
  { value: 'casual', label: 'Casual' },
  { value: 'social', label: 'Very social' },
];

export default function OnboardingPage() {
  const router = useRouter();

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

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [availabilityTimes, setAvailabilityTimes] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState('balanced');
  const [socialStyle, setSocialStyle] = useState('casual');

  const toggleDay = (day: string) => {
    setAvailabilityDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleTime = (time: string) => {
    setAvailabilityTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const canAdvance =
    (step === 1 && availabilityDays.length > 0 && availabilityTimes.length > 0) ||
    (step === 2 && !!energyLevel && !!socialStyle);

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body = {
        userId: vcUser?.userId ?? 'guest',
        activity: 'study',
        activities: ['study'],
        energyLevel,
        vibe: energyLevel,
        socialStyle,
        indoorOutdoor: 'both' as const,
        sustainability: 'low',
        availabilityDays,
        availabilityTimes,
      };

      const res = await fetch('/api/preferences/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetch('/api/user/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: vcUser?.userId ?? 'guest' }),
        });
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

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-2xl text-[var(--muted)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VanConnect" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/swipe')}
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block"
          >
            Skip for now
          </button>
          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold">
            {userName.charAt(0)}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-3xl flex flex-col gap-8">
          {step === 1 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Availability</h1>
                <p className="text-[var(--muted)] mt-2">
                  When are you usually free? This helps us coordinate groups.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Days
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {DAY_OPTIONS.map((day) => {
                      const active = availabilityDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Preferred time
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {TIME_OPTIONS.map((time) => {
                      const active = availabilityTimes.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTime(time)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Personality & Social Style</h1>
                <p className="text-[var(--muted)] mt-2">
                  Tell us your vibe so we can match you with the right people.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Energy level
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {ENERGY_OPTIONS.map((option) => {
                      const active = energyLevel === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setEnergyLevel(option.value)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Social style
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {SOCIAL_STYLE_OPTIONS.map((option) => {
                      const active = socialStyle === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSocialStyle(option.value)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 1}
              className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--muted)] disabled:opacity-40"
            >
              Back
            </button>
            {step < 2 ? (
              <button
                onClick={next}
                disabled={!canAdvance}
                className="rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canAdvance || loading}
                className="rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
