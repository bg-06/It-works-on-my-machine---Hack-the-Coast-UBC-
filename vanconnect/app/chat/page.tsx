'use client';

import { Suspense, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { uid } from '@/lib/uid';

type GroupMember = {
  id: string;
  name: string;
};

type GroupSummary = {
  id: string;
  activity: string;
  locationName: string;
  createdAt: string;
  members: GroupMember[];
  lastMessage: string;
  lastMessageAt: string;
};

type ChatMessage = {
  id: string;
  sender: string;
  senderPhoto?: string;
  text: string;
  time: string;
  tone?: 'highlight' | 'muted';
};

const AVATAR_STYLES = [
  'bg-[var(--primary)]/10 text-[var(--primary)]',
  'bg-emerald-50 text-emerald-700',
  'bg-slate-100 text-slate-700',
  'bg-amber-50 text-amber-700',
];

const formatRelative = (input?: string) => {
  if (!input) return '';
  const target = new Date(input);
  const diffMs = Date.now() - target.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const toTitle = (value: string) =>
  value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const initialsFor = (label: string) =>
  label
    .split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function ChatLandingPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[var(--muted)]">Loading chat…</div>}>
      <ChatLandingContent />
    </Suspense>
  );
}

function ChatLandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('groupId');
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [geminiLog, setGeminiLog] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vc_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const id = parsed.userId ?? parsed._id ?? parsed.id;
        if (id) return;
      }
    } catch {}
    router.replace('/');
  }, [router]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const stored = localStorage.getItem('vc_user');
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.userId ?? user?._id ?? user?.id;

        if (!userId) {
          setGroups([]);
          setLoadingGroups(false);
          return;
        }

        const res = await fetch(`/api/group?userId=${userId}`);
        if (!res.ok) {
          setGroups([]);
          setLoadingGroups(false);
          return;
        }

        const data = await res.json();
        const mapped: GroupSummary[] = (data ?? []).map((group: any) => ({
          id: group.id ?? group._id,
          activity: group.activity ?? 'Group',
          locationName: group.locationName ?? '',
          createdAt: group.createdAt ?? new Date().toISOString(),
          members: group.members ?? [],
          lastMessage: group.lastMessage ?? '',
          lastMessageAt: group.lastMessageAt ?? group.createdAt ?? new Date().toISOString(),
        }));

        setGroups(mapped);
        setActiveId((prev) => prev ?? mapped[0]?.id ?? null);
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    if (!requestedId || groups.length === 0) return;
    const exists = groups.some((group) => group.id === requestedId);
    if (exists) {
      setActiveId(requestedId);
    }
  }, [requestedId, groups]);

  const loadMessages = useCallback(async (groupId: string | null, isPolling = false) => {
    if (!groupId) {
      setMessages([]);
      return;
    }

    if (!isPolling) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/get?groupId=${groupId}`);
      if (!res.ok) {
        if (!isPolling) setMessages([]);
        return;
      }
      const data = await res.json();
      const mapped: ChatMessage[] = (data ?? []).map((message: any, index: number) => ({
        id: message._id ?? message.id ?? uid(),
        sender: message.senderName ?? (message.isAI ? 'AI Assistant' : 'Member'),
        senderPhoto: message.senderPhoto ?? undefined,
        text: message.text ?? '',
        time: formatRelative(message.createdAt ?? new Date().toISOString()),
        tone: index === 0 ? 'highlight' : undefined,
      }));
      setMessages(mapped);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Poll for new messages every 3 seconds
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(() => {
      loadMessages(activeIdRef.current, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeId) ?? groups[0],
    [groups, activeId]
  );

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((group) => {
      const name = (group.locationName || group.activity)?.toLowerCase() ?? '';
      const activity = group.activity?.toLowerCase() ?? '';
      const memberNames = group.members.map((member) => member.name?.toLowerCase() ?? '').join(' ');
      return name.includes(term) || activity.includes(term) || memberNames.includes(term);
    });
  }, [groups, searchTerm]);

  const handleSend = async () => {
    if (!draft.trim() || !activeGroup) return;
    const raw = draft.trim();
    const invokeAI = /@gemini\b/i.test(raw);
    const text = raw.replace(/@gemini\b/gi, '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    setDraft('');
    setSending(true);

    const optimistic: ChatMessage = {
      id: uid(),
      sender: 'You',
      text,
      time: 'now',
      tone: 'highlight',
    };
    const aiPlaceholder: ChatMessage | null = invokeAI
      ? {
          id: `ai-${uid()}`,
          sender: 'Gemini',
          text: 'Thinking…',
          time: 'now',
          tone: 'muted',
        }
      : null;
    setMessages((prev) => [...prev, optimistic, ...(aiPlaceholder ? [aiPlaceholder] : [])]);

    try {
      const stored = localStorage.getItem('vc_user');
      const user = stored ? JSON.parse(stored) : null;
      const senderId = user?.userId ?? user?._id ?? user?.id;
      const senderName = user?.name ?? 'You';
      const senderPhoto = user?.photoUrl ?? user?.photo ?? user?.avatarUrl;

      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: activeGroup.id,
          senderId,
          senderName,
          senderPhoto,
          text,
          askAI: invokeAI,
        }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (data?.ai?.text) {
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== aiPlaceholder?.id),
          {
            id: data.ai._id ?? data.ai.id ?? uid(),
            sender: data.ai.senderName ?? 'Gemini',
            text: data.ai.text,
            time: 'now',
            tone: 'muted',
          },
        ]);
        setGeminiLog(null);
      } else if (invokeAI) {
        setGeminiLog(
          data?.error ? `Gemini error: ${data.error}` : 'Gemini response missing.'
        );
      }
      await loadMessages(activeGroup.id);
    } catch (err) {
      console.error('Failed to send message:', err);
      if (invokeAI) {
        setGeminiLog(`Gemini request failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDraftKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--toolbar-clearance,0px))] bg-[var(--background)] text-[var(--foreground)]">
      <div className="relative min-h-[calc(100vh-var(--toolbar-clearance,0px))]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(5,102,97,0.12),_transparent_55%),_radial-gradient(circle_at_20%_20%,_rgba(13,84,80,0.10),_transparent_60%)]" />
        <div className="mx-auto flex min-h-[calc(100vh-var(--toolbar-clearance,0px))] max-h-[100vh] max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8 overflow-hidden">

          <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] min-h-0">
            <section className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm min-h-0 max-h-[calc(100vh-120px)] overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Your groups</h2>
                  <p className="text-xs text-[var(--muted)]">Stay synced with every crew.</p>
                </div>
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                  {loadingGroups ? 'Loading' : `${groups.length} active`}
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <span className="text-sm">🔎</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search groups or members"
                  className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
                />
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {loadingGroups ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                    Fetching your groups…
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                    No groups match your search yet.
                  </div>
                ) : (
                  filteredGroups.map((group, index) => {
                    const isActive = group.id === activeId;
                    const groupName = toTitle(group.locationName || group.activity || 'Group');
                    const members = group.members ?? [];
                    const avatarStyle = AVATAR_STYLES[index % AVATAR_STYLES.length];

                    return (
                      <button
                        key={group.id}
                        onClick={() => setActiveId(group.id)}
                        className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-[var(--primary)]/40 bg-[var(--primary)]/10'
                            : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30'
                        }`}
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold ${avatarStyle}`}>
                          {initialsFor(groupName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{groupName}</p>
                            <span className="text-xs text-[var(--muted)]">{formatRelative(group.lastMessageAt)}</span>
                          </div>
                          <p className="truncate text-xs text-[var(--muted)]">
                            {group.lastMessage || 'Start the conversation.'}
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            {members.slice(0, 4).map((member) => {
                              const initial = (member.name ?? 'M').charAt(0).toUpperCase();
                              return (
                                <div
                                  key={`${group.id}-${member.id}`}
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold ${
                                    isActive
                                      ? 'border-[var(--primary)]/30 bg-[var(--background)] text-[var(--primary)]'
                                      : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)]'
                                  }`}
                                >
                                  {initial}
                                </div>
                              );
                            })}
                            {members.length > 4 && (
                              <span className="text-[10px] text-[var(--muted)]">+{members.length - 4}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-xs text-[var(--muted)]">
                Tip: Use the search bar to find members across your groups.
              </div>
            </section>

            <section className="flex min-h-0 max-h-[calc(100vh-120px)] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    {activeGroup?.activity ?? 'Group chat'}
                  </p>
                  <h2 className="text-2xl font-semibold">
                    {activeGroup ? toTitle(activeGroup.locationName || activeGroup.activity) : 'Select a group'}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {activeGroup ? `${activeGroup.members.length} members` : 'Choose a group to see messages.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={activeGroup ? `/chat?groupId=${activeGroup.id}` : '/chat'}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold text-[var(--foreground)]"
                  >
                    Open thread
                  </Link>
                  <button className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white">
                    Schedule meetup
                  </button>
                </div>
              </div>

              {geminiLog && (
                <div className="flex flex-col gap-1 border-b border-[var(--border)] bg-[var(--background)] px-6 py-3 text-xs">
                  <div className="text-[11px] text-[var(--muted)]">
                    {geminiLog}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex min-h-0 flex-col gap-3">
                  {loadingMessages ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                      Loading chat preview…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                      No messages yet. Start the conversation.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isAssistant = message.sender.toLowerCase().includes('ai') || message.sender.toLowerCase() === 'gemini';
                      const isYou = message.sender.toLowerCase() === 'you';
                      return (
                        <div key={message.id} className="flex items-start gap-3">
                          {message.senderPhoto ? (
                            <img
                              src={message.senderPhoto}
                              alt={message.sender}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold ${
                                isAssistant
                                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                                  : isYou
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {message.sender
                                .split(' ')
                                .map((word) => word.charAt(0))
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                              <span className="font-semibold text-[var(--foreground)]">{message.sender}</span>
                              <span>·</span>
                              <span>{message.time}</span>
                              {isAssistant && (
                                <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                                  AI Assist
                                </span>
                              )}
                            </div>
                            <div className="rounded-xl bg-[var(--background)]/70 px-4 py-2 text-sm leading-relaxed text-[var(--foreground)]">
                              {message.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-[var(--border)] px-6 py-5">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <span className="text-lg">💬</span>
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleDraftKeyDown}
                    placeholder={activeGroup ? 'Write a message…' : 'Pick a group to chat'}
                    disabled={!activeGroup || sending}
                    className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!activeGroup || sending || !draft.trim()}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-40"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                  <span>AI Assist ready for itinerary ideas.</span>
                  <span>Last activity {formatRelative(activeGroup?.lastMessageAt)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
