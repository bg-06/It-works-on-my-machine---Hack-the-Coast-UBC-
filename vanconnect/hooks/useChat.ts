'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/types';
import { uid } from '@/lib/uid';

export function useChat(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* ---- fetch messages ---- */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/get?groupId=${groupId}`);
      if (!res.ok) return;
      const data = await res.json();

      // normalise Mongo docs → Message shape
      const mapped: Message[] = (data ?? []).map((m: any) => ({
        id: m._id ?? m.id ?? uid(),
        groupId: m.groupId ?? groupId,
        senderId: m.senderId,
        senderType: m.isAI ? 'assistant' : 'user',
        text: m.text,
        createdAt: m.createdAt ?? new Date().toISOString(),
        senderName: m.senderName ?? (m.isAI ? 'AI Assistant' : 'User'),
        senderPhoto: m.senderPhoto,
      }));

      setMessages(mapped);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  /* ---- poll every 3 s ---- */
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  /* ---- send a normal message ---- */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setSending(true);

      // Optimistic update
      const optimistic: Message = {
        id: uid(),
        groupId,
        senderType: 'user',
        text,
        createdAt: new Date().toISOString(),
        senderName: 'You',
      };
      setMessages(prev => [...prev, optimistic]);

      try {
        const stored = localStorage.getItem('vc_user');
        const user = stored ? JSON.parse(stored) : null;
        const senderId = user?.userId ?? user?._id ?? user?.id;
        const senderName = user?.name ?? 'You';
        const senderPhoto = user?.photoUrl ?? user?.photo ?? user?.avatarUrl;

        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, text, senderId, senderName, senderPhoto }),
        });
        // re-fetch to get server version
        await fetchMessages();
      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setSending(false);
      }
    },
    [groupId, fetchMessages],
  );

  /* ---- ask the AI assistant ---- */
  const askAssistant = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;
      setSending(true);

      const userMsg: Message = {
        id: uid(),
        groupId,
        senderType: 'user',
        text: `[AI Question] ${prompt}`,
        createdAt: new Date().toISOString(),
        senderName: 'You',
      };
      setMessages(prev => [...prev, userMsg]);

      try {
        const stored = localStorage.getItem('vc_user');
        const user = stored ? JSON.parse(stored) : null;
        const senderId = user?.userId ?? user?._id ?? user?.id;
        const senderName = user?.name ?? 'You';
        const senderPhoto = user?.photoUrl ?? user?.photo ?? user?.avatarUrl;

        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            text: prompt,
            askAI: true,
            senderId,
            senderName,
            senderPhoto,
          }),
        });
        await fetchMessages();
      } catch (err) {
        console.error('Failed to ask assistant:', err);
      } finally {
        setSending(false);
      }
    },
    [groupId, fetchMessages],
  );

  return { messages, loading, sending, sendMessage, askAssistant };
}
