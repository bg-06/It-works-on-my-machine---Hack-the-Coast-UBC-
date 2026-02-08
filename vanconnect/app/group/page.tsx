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
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200';
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
  const [showCreate, setShowCreate] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [eventTime, setEventTime] = useState('');
  const [locationName, setLocationName] = useState('');

  const loadGroups = async () => {
      try {
        const stored = localStorage.getItem('vc_user');
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.userId ?? user?._id ?? user?.id;

        if (!userId) {
          setGroups([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/group?userId=${userId}`);
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
        setSelectedGroupId((prev) => prev || mapped[0]?.id || '');
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadGroups();
  }, []);

  const openCreate = () => {
    setEventTime('');
    setLocationName('');
    setShowCreate(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !eventTime) return;
    setSavingEvent(true);
    try {
      const res = await fetch('/api/group/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          eventTime,
          locationName,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        await loadGroups();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setSavingEvent(false);
    }
  };

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
            <button
              onClick={openCreate}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
            >
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
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">{bucket.label}</h2>
                    <span className="text-xs text-[var(--muted)]">{bucket.items.length} events</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {bucket.items.map((group) => (
                      <div
                        key={group.id}
                        className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-slate-900"
                      >
                        <div className="w-20 text-sm font-semibold text-[var(--primary)]">
                          {formatTime(group.eventTime)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">
                              {group.locationName || `${group.activity} meetup`}
                            </h3>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor(
                                group.status
                              )}`}
                            >
                              {group.status ?? 'forming'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{group.activity}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>{group.members.length} members</span>
                          <Link
                            href={`/chat?groupId=${group.id}`}
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">Create event</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Set time and location for a group.</p>
            <form onSubmit={handleCreateEvent} className="mt-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.activity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date & time</label>
                <input
                  type="datetime-local"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                  placeholder="e.g., Koerner Library"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingEvent ? 'Saving…' : 'Save event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
