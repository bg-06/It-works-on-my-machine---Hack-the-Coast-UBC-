'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';

type GroupMember = {
  id: string;
  name: string;
};

type GroupSummary = {
  id: string;
  activity: string;
  createdAt: string;
  members: GroupMember[];
  lastMessage: string;
  lastMessageAt: string;
};

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  time: string;
  tone?: 'highlight' | 'muted';
};

const ACCENTS = ['#F4A261', '#E76F51', '#2A9D8F', '#277DA1', '#8D6B94', '#06D6A0', '#EF476F'];

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

export default function ChatLandingPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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

        const res = await fetch(`/api/groups?userId=${userId}`);
        if (!res.ok) {
          setGroups([]);
          setLoadingGroups(false);
          return;
        }

        const data = await res.json();
        const mapped: GroupSummary[] = (data ?? []).map((group: any) => ({
          id: group.id ?? group._id,
          activity: group.activity ?? 'Group',
          createdAt: group.createdAt ?? new Date().toISOString(),
          members: group.members ?? [],
          lastMessage: group.lastMessage ?? '',
          lastMessageAt: group.lastMessageAt ?? group.createdAt ?? new Date().toISOString(),
        }));

        setGroups(mapped);
        setActiveId(mapped[0]?.id ?? null);
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeId) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/get?groupId=${activeId}`);
        if (!res.ok) {
          setMessages([]);
          return;
        }
        const data = await res.json();
        const mapped: ChatMessage[] = (data ?? []).map((message: any, index: number) => ({
          id: message._id ?? message.id ?? crypto.randomUUID(),
          sender: message.senderName ?? (message.isAI ? 'AI Assistant' : 'Member'),
          text: message.text ?? '',
          time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Now',
          tone: index === 0 ? 'highlight' : undefined,
        }));
        setMessages(mapped);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeId]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeId) ?? groups[0],
    [groups, activeId]
  );

  return (
    <div
      className="min-h-screen bg-[var(--chat-sand)] text-[var(--chat-ink)]"
      style={
        {
          '--chat-sand': '#f5f1ea',
          '--chat-ink': '#1d2421',
          '--chat-forest': '#1b4332',
          '--chat-moss': '#40916c',
          '--chat-mist': '#f9f6f1',
          '--chat-border': '#e5ded3',
          '--chat-shadow': '0 24px 60px rgba(17, 24, 39, 0.12)',
        } as React.CSSProperties
      }
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,145,108,0.18),_transparent_55%),_radial-gradient(circle_at_20%_20%,_rgba(231,111,81,0.12),_transparent_55%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--chat-forest)] opacity-70">
                VanConnect Chats
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your groups, all in one feed
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full border border-[var(--chat-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--chat-forest)] shadow-sm backdrop-blur">
                New group
              </button>
              <button className="rounded-full bg-[var(--chat-forest)] px-4 py-2 text-sm font-semibold text-white shadow-md">
                Start chat
              </button>
            </div>
          </header>

          <div className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
            <section className="flex flex-col gap-4 rounded-3xl border border-[var(--chat-border)] bg-white/80 p-5 shadow-[var(--chat-shadow)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--chat-forest)]">Groups</h2>
                <span className="text-xs text-[var(--chat-ink)] opacity-60">
                  {loadingGroups ? 'Loading…' : `${groups.length} active`}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-mist)] px-4 py-3">
                <span className="text-lg">🔎</span>
                <input
                  type="text"
                  placeholder="Search groups or people"
                  className="w-full bg-transparent text-sm font-medium text-[var(--chat-ink)] placeholder:text-[var(--chat-ink)] placeholder:opacity-40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3">
                {loadingGroups ? (
                  <div className="rounded-2xl border border-dashed border-[var(--chat-border)] bg-white/60 px-4 py-6 text-center text-sm text-[var(--chat-ink)] opacity-60">
                    Fetching your groups…
                  </div>
                ) : groups.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--chat-border)] bg-white/60 px-4 py-6 text-center text-sm text-[var(--chat-ink)] opacity-60">
                    No groups yet. Match to create one.
                  </div>
                ) : (
                  groups.map((group, index) => {
                    const isActive = group.id === activeId;
                    const groupName = toTitle(group.activity || 'Group');
                    const members = group.members ?? [];
                    const accent = ACCENTS[index % ACCENTS.length];

                    return (
                      <button
                        key={group.id}
                        onClick={() => setActiveId(group.id)}
                        className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-transparent bg-[var(--chat-forest)] text-white shadow-lg'
                            : 'border-[var(--chat-border)] bg-white/70 hover:border-[var(--chat-forest)]/40'
                        }`}
                      >
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold"
                          style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : accent, color: '#fff' }}
                        >
                          {groupName
                            .split(' ')
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{groupName}</p>
                            <span className="text-xs opacity-70">{formatRelative(group.lastMessageAt)}</span>
                          </div>
                          <p className="truncate text-xs opacity-80">
                            {group.lastMessage || 'Start the conversation.'}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {members.slice(0, 4).map((member) => {
                                const initial = (member.name ?? 'M').charAt(0).toUpperCase();
                                return (
                                  <div
                                    key={`${group.id}-${member.id}`}
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold ${
                                      isActive
                                        ? 'border-white/50 bg-white/20 text-white'
                                        : 'border-[var(--chat-border)] bg-white text-[var(--chat-ink)]'
                                    }`}
                                  >
                                    {initial}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="flex flex-col rounded-3xl border border-[var(--chat-border)] bg-white/90 shadow-[var(--chat-shadow)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--chat-border)] px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--chat-forest)] opacity-60">
                    {activeGroup?.activity ?? 'Group chat'}
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--chat-forest)]">
                    {activeGroup ? toTitle(activeGroup.activity) : 'Select a group'}
                  </h2>
                  <p className="text-sm text-[var(--chat-ink)] opacity-70">
                    {activeGroup ? `${activeGroup.members.length} members` : ' '}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={activeGroup ? `/chat/${activeGroup.id}` : '/chat'}
                    className="rounded-full border border-[var(--chat-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--chat-forest)]"
                  >
                    Open thread
                  </Link>
                  <button className="rounded-full bg-[var(--chat-forest)] px-4 py-2 text-xs font-semibold text-white">
                    Schedule meetup
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-col gap-4">
                  {loadingMessages ? (
                    <div className="rounded-2xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-mist)] px-4 py-6 text-center text-sm text-[var(--chat-ink)] opacity-60">
                      Loading chat preview…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-mist)] px-4 py-6 text-center text-sm text-[var(--chat-ink)] opacity-60">
                      No messages yet. Start the conversation.
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isHighlight = message.tone === 'highlight';
                      const badgeTextClass = isHighlight ? 'text-white/70' : 'text-[var(--chat-ink)] opacity-60';
                      const badgeBgClass = isHighlight ? 'bg-white/20' : 'bg-white';

                      return (
                        <div
                          key={message.id}
                          className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 ${
                            isHighlight
                              ? 'border-transparent bg-[var(--chat-forest)] text-white'
                              : message.tone === 'muted'
                              ? 'border-[var(--chat-border)] bg-[var(--chat-mist)] text-[var(--chat-ink)] opacity-70'
                              : 'border-[var(--chat-border)] bg-white text-[var(--chat-ink)]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] opacity-70">
                            <span>{message.sender}</span>
                            <span>{message.time}</span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed">{message.text}</p>
                          {index === 1 && (
                            <div className={`flex items-center gap-3 text-[11px] ${badgeTextClass}`}>
                              <span className={`rounded-full px-3 py-1 ${badgeBgClass}`}>3 riders confirmed</span>
                              <span className={`rounded-full px-3 py-1 ${badgeBgClass}`}>Meet at 6:30 PM</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-[var(--chat-border)] px-6 py-5">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-mist)] px-4 py-3">
                  <span className="text-lg">💬</span>
                  <input
                    type="text"
                    placeholder="Write a message to the group..."
                    className="flex-1 bg-transparent text-sm font-medium text-[var(--chat-ink)] placeholder:text-[var(--chat-ink)] placeholder:opacity-40 focus:outline-none"
                  />
                  <button className="rounded-full bg-[var(--chat-forest)] px-4 py-2 text-xs font-semibold text-white">
                    Send
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--chat-ink)] opacity-60">
                  <span>AI Assist ready for itinerary ideas</span>
                  <span>Last activity 2 minutes ago</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
