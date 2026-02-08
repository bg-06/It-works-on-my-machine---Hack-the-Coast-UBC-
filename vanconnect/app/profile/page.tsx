'use client';

import { useEffect, useMemo, useState } from 'react';

type PreferenceState = {
  activity: string;
  activities: string[];
  energyLevel: string;
  vibe: string;
  socialStyle: string;
  indoorOutdoor: string;
  sustainability: string;
  availabilityDays: string[];
  availabilityTimes: string[];
};

const ENERGY_OPTIONS = [
  { value: 'chill', label: 'Chill' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'active', label: 'Active' },
];

const VIBE_OPTIONS = [
  { value: 'chill', label: 'Chill' },
  { value: 'focused', label: 'Focused' },
  { value: 'social', label: 'Social' },
  { value: 'active', label: 'Active' },
  { value: 'balanced', label: 'Balanced' },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: 'quiet', label: 'Quiet / focused' },
  { value: 'casual', label: 'Casual' },
  { value: 'social', label: 'Very social' },
];

const INDOOR_OUTDOOR_OPTIONS = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'both', label: 'Both' },
];

const SUSTAINABILITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'transit', label: 'Transit' },
  { value: 'biking', label: 'Biking' },
];

const ACTIVITY_OPTIONS = [
  { value: 'hiking', label: 'Hiking' },
  { value: 'photography', label: 'Photography' },
  { value: 'social', label: 'Social' },
  { value: 'study', label: 'Study' },
  { value: 'fitness', label: 'Fitness' },
];

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [prefs, setPrefs] = useState<PreferenceState>({
    activity: 'study',
    activities: ['study'],
    energyLevel: 'balanced',
    vibe: 'balanced',
    socialStyle: 'casual',
    indoorOutdoor: 'both',
    sustainability: 'medium',
    availabilityDays: [],
    availabilityTimes: [],
  });

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem('vc_user');
        const user = stored ? JSON.parse(stored) : null;
        const id = user?.userId ?? user?._id ?? user?.id ?? null;
        setUserId(id);

        if (!id) {
          setLoading(false);
          return;
        }

        const [userRes, prefRes] = await Promise.all([
          fetch(`/api/user/get?userId=${id}`),
          fetch(`/api/preferences/get?userId=${id}`),
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setName(data?.name ?? '');
          setEmail(data?.email ?? '');
          setPhotoUrl(data?.photoUrl ?? '');
        }

        if (prefRes.ok) {
          const pref = await prefRes.json();
          if (pref) {
            setPrefs({
              activity: pref.activity ?? 'study',
              activities: pref.activities ?? (pref.activity ? [pref.activity] : ['study']),
              energyLevel: pref.energyLevel ?? 'balanced',
              vibe: pref.vibe ?? 'balanced',
              socialStyle: pref.socialStyle ?? 'casual',
              indoorOutdoor: pref.indoorOutdoor ?? 'both',
              sustainability: pref.sustainability ?? 'medium',
              availabilityDays: pref.availabilityDays ?? [],
              availabilityTimes: pref.availabilityTimes ?? [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const initials = useMemo(() => (name ? name.charAt(0).toUpperCase() : '?'), [name]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!userId) {
      setError('No user found.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name,
          email,
          photoUrl,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile.');
        return;
      }

      const stored = JSON.parse(localStorage.getItem('vc_user') || '{}');
      stored.name = data.name ?? name;
      stored.email = data.email ?? email;
      stored.photoUrl = data.photoUrl ?? photoUrl;
      localStorage.setItem('vc_user', JSON.stringify(stored));

      setPassword('');
      setConfirmPassword('');
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError('No user found.');
      return;
    }

    setSavingPrefs(true);
    try {
      const res = await fetch('/api/preferences/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activity: prefs.activity,
          activities: prefs.activities,
          energyLevel: prefs.energyLevel,
          vibe: prefs.vibe,
          socialStyle: prefs.socialStyle,
          indoorOutdoor: prefs.indoorOutdoor,
          sustainability: prefs.sustainability,
          availabilityDays: prefs.availabilityDays,
          availabilityTimes: prefs.availabilityTimes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save preferences.');
        return;
      }

      setSuccess('Preferences updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-xl text-[var(--muted)]">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Profile</p>
            <h1 className="text-3xl font-semibold tracking-tight">Account & preferences</h1>
          </div>
        </header>

        {(error || success) && (
          <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || success}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-white text-2xl font-semibold">
                  {initials}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">Profile details</h2>
                <p className="text-sm text-[var(--muted)]">Update your name, email, password, and avatar.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="mt-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  placeholder="you@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile photo URL</label>
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="mt-2 h-11 rounded-full bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold">Preferences</h2>
              <p className="text-sm text-[var(--muted)]">Tune your matching preferences.</p>
            </div>

            <form onSubmit={handlePreferencesSave} className="mt-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Activity</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((option) => {
                    const active = prefs.activities.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            activities: active
                              ? prev.activities.filter((a) => a !== option.value)
                              : [...prev.activities, option.value],
                            activity: active
                              ? prev.activity === option.value
                                ? prev.activities.filter((a) => a !== option.value)[0] ?? 'study'
                                : prev.activity
                              : prev.activity && prev.activities.includes(prev.activity)
                                ? prev.activity
                                : option.value,
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                            : 'border-[var(--border)] bg-white text-[var(--muted)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Energy level</label>
                <select
                  value={prefs.energyLevel}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, energyLevel: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {ENERGY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vibe</label>
                <select
                  value={prefs.vibe}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, vibe: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {VIBE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Social style</label>
                <select
                  value={prefs.socialStyle}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, socialStyle: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {SOCIAL_STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Indoor or outdoor</label>
                <select
                  value={prefs.indoorOutdoor}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, indoorOutdoor: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sustainability</label>
                <select
                  value={prefs.sustainability}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, sustainability: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {SUSTAINABILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Available days</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const active = prefs.availabilityDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            availabilityDays: active
                              ? prev.availabilityDays.filter((d) => d !== day)
                              : [...prev.availabilityDays, day],
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                            : 'border-[var(--border)] bg-white text-[var(--muted)]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred times</label>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((time) => {
                    const active = prefs.availabilityTimes.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            availabilityTimes: active
                              ? prev.availabilityTimes.filter((t) => t !== time)
                              : [...prev.availabilityTimes, time],
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                            : 'border-[var(--border)] bg-white text-[var(--muted)]'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                disabled={savingPrefs}
                className="mt-2 h-11 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--primary)] disabled:opacity-50"
              >
                {savingPrefs ? 'Saving…' : 'Save preferences'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
