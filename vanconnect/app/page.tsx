'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'login' | 'register';

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ---- Submit handler ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: username, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 404) {
            // No account – flip to register automatically
            setMode('register');
            setError('No account found with that username. Create one below — your details have been kept.');
            setLoading(false);
            return;
          }
          setError(data.error || 'Login failed.');
          setLoading(false);
          return;
        }

        // Store user in localStorage for hackathon simplicity
        localStorage.setItem('vc_user', JSON.stringify(data));
        // Check if already onboarded → skip to swipe
        if (data.onboarded) {
          router.push('/swipe');
        } else {
          router.push('/onboarding');
        }
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: username, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Registration failed.');
          setLoading(false);
          return;
        }

        localStorage.setItem('vc_user', JSON.stringify(data));
        router.push('/onboarding');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Toggle between modes ---- */
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setConfirmPassword('');
    if (mode === 'login') {
      setEmail('');
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* ---- Left hero panel (hidden on mobile) ---- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.trvl-media.com/place/507172/a91f7078-656e-40b4-b2c8-8d52942d488f.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VanConnect" className="h-30 w-auto" />
            <span className="text-3xl font-bold tracking-tight text-white">VanConnect</span>
          </div>

          {/* Headline */}
          <div className="max-w-md mt-auto mb-[50px]">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Coordinate sustainably.<br />Connect locally.
            </h1>
            <p className="text-lg text-white/90 font-light">
              Join thousands of Vancouverites in making a difference in their community.
            </p>
          </div>

          {/* Decorative dots */}
          <div className="flex gap-2">
            <div className="h-1 w-8 bg-white rounded-full" />
            <div className="h-1 w-2 bg-white/50 rounded-full" />
            <div className="h-1 w-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* ---- Right form panel ---- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[var(--card)]">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="VanConnect" className="h-10 w-auto" />
              <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">VanConnect</span>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-[var(--muted)]">
              {mode === 'login'
                ? 'Enter your username and password to sign in.'
                : 'Pick a username and password to get started.'}
            </p>
          </div>

          {/* Error banner (inline, not a popup) */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-[var(--foreground)]">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors"
                />
                <div className="absolute right-3 top-3 text-[var(--muted)]">
                  <span className="text-[20px]">👤</span>
                </div>
              </div>
            </div>

            {/* Email (register only) */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors"
                  />
                  <div className="absolute right-3 top-3 text-[var(--muted)]">
                    <span className="text-[20px]">✉️</span>
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <span className="text-[20px]">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-medium text-[var(--foreground)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors"
                  />
                  <div className="absolute right-3 top-3 text-[var(--muted)]">
                    <span className="text-[20px]">🔒</span>
                  </div>
                </div>
              </div>
            )}

            {/* Remember me (login only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20 focus:ring-offset-0"
                  />
                  <span className="text-sm text-[var(--muted)]">Remember me</span>
                </label>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-50 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] h-12 w-full shadow-sm"
            >
              {loading
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card)] px-2 text-[var(--muted)]">Or</span>
            </div>
          </div>

          {/* Toggle login / register */}
          <div className="text-center text-sm text-[var(--muted)]">
            {mode === 'login' ? (
              <>
                New to VanConnect?{' '}
                <button onClick={switchMode} className="font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={switchMode} className="font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline">
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
