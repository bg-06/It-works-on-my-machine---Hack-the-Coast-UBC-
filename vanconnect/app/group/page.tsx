'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type GroupSummary = {
  id: string;
  activity: string;
  members: { id: string; name: string }[];
  eventTime?: string | null;
  locationName?: string;
  status?: string;
};

type DayBucket = {
  label: string;
  key: string;
  items: GroupSummary[];
};

const statusColor = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'completed':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'cancelled':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
};

const formatDayKey = (input?: string | null) => {
  if (!input) return 'unscheduled';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'unscheduled';
  return date.toDateString();
};

const formatDayLabel = (input?: string | null) => {
  if (!input) return 'Unscheduled';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Unscheduled';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (input?: string | null) => {
  if (!input) return 'TBA';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'TBA';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export default function GroupsSchedulePage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem('vc_user');
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.userId ?? user?._id ?? user?.id;

        if (!userId) {
          setGroups([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/groups?userId=${userId}`);
        if (!res.ok) {
          setGroups([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const mapped: GroupSummary[] = (data ?? []).map((group: any) => ({
          id: group.id ?? group._id,
          activity: group.activity ?? 'Group',
          members: group.members ?? [],
          eventTime: group.eventTime ?? null,
          locationName: group.locationName ?? '',
          status: group.status ?? 'forming',
        }));

        setGroups(mapped);
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const buckets = useMemo<DayBucket[]>(() => {
    const map = new Map<string, DayBucket>();
    groups.forEach((group) => {
      const key = formatDayKey(group.eventTime);
      const label = formatDayLabel(group.eventTime);
      if (!map.has(key)) {
        map.set(key, { key, label, items: [] });
      }
      map.get(key)?.items.push(group);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === 'unscheduled') return 1;
      if (b.key === 'unscheduled') return -1;
      return new Date(a.key).getTime() - new Date(b.key).getTime();
    });
  }, [groups]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Group Schedule</p>
            <h1 className="text-3xl font-semibold tracking-tight">Your upcoming group events</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]"
            >
              Go to chat
            </Link>
            <button className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
              Create event
            </button>
          </div>
        </header>

        <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">Loading events…</div>
          ) : buckets.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">
              No group events scheduled yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {buckets.map((bucket) => (
                <div key={bucket.key} className="px-6 py-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{bucket.label}</h2>
                    <span className="text-xs text-[var(--muted)]">{bucket.items.length} events</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {bucket.items.map((group) => (
                      <div
                        key={group.id}
                        className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-white px-4 py-4"
                      >
                        <div className="w-20 text-sm font-semibold text-[var(--primary)]">
                          {formatTime(group.eventTime)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">{group.activity}</h3>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor(
                                group.status
                              )}`}
                            >
                              {group.status ?? 'forming'}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--muted)]">
                            {group.locationName || 'Location to be announced'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                          <span>{group.members.length} members</span>
                          <Link
                            href={`/chat/${group.id}`}
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--primary)]"
                          >
                            Open chat
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
