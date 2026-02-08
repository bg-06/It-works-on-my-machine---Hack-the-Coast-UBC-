'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/types';

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
        id: m._id ?? m.id ?? crypto.randomUUID(),
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
        id: crypto.randomUUID(),
        groupId,
        senderType: 'user',
        text,
        createdAt: new Date().toISOString(),
        senderName: 'You',
      };
      setMessages(prev => [...prev, optimistic]);

      try {
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, text }),
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

      // Show the user's prompt as a message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        groupId,
        senderType: 'user',
        text: `[AI Question] ${prompt}`,
        createdAt: new Date().toISOString(),
        senderName: 'You',
      };
      setMessages(prev => [...prev, userMsg]);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        groupId,
        senderType: 'assistant',
        text: `Great question! Here are some ideas based on "${prompt}":\n\n• Check out local Vancouver spots on Google Maps\n• Try asking your group members in the chat\n• Browse UBC events at events.ubc.ca`,
        createdAt: new Date().toISOString(),
        senderName: 'AI Assistant',
      };
      setMessages(prev => [...prev, aiMsg]);
      setSending(false);
    },
    [groupId],
  );

  return { messages, loading, sending, sendMessage, askAssistant };
}
