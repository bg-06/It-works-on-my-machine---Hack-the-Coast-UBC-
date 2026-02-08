import Link from 'next/link';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6">
      <div className="max-w-md text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-3">Explore</p>
        <h1 className="text-2xl font-semibold mb-2">Explore is coming soon</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          We are still building the Explore experience. Check back soon.
        </p>
        <Link
          href="/swipe"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
