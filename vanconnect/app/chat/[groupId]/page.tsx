'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import Image from 'next/image';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { messages, loading, sending, sendMessage, askAssistant } = useChat(groupId);
  const [inputText, setInputText] = useState('');
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !sending) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleAssistant = async () => {
    if (assistantPrompt.trim()) {
      await askAssistant(assistantPrompt);
      setAssistantPrompt('');
      setShowAssistant(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Group Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.senderType === 'assistant' ? 'bg-purple-50 -mx-4 px-4 py-3' : ''
              }`}
            >
              {message.senderType === 'assistant' ? (
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  🤖
                </div>
              ) : message.senderPhoto ? (
                <Image
                  src={message.senderPhoto}
                  alt={message.senderName || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {message.senderName?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700">
                  {message.senderType === 'assistant' ? 'AI Assistant' : message.senderName}
                </div>
                <div className="text-gray-800 mt-1">{message.text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowAssistant(true)}
            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
          >
            🤖 Ask AI Assistant
          </button>
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>

        <div className="text-xs text-gray-500 mt-2 text-center">
          Updated just now
        </div>
      </div>

      {/* Assistant Modal */}
      {showAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask AI Assistant</h2>
            <p className="text-gray-600 mb-4">
              Get suggestions for places, activities, or conversation starters!
            </p>
            <textarea
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              placeholder="E.g., Suggest a good coffee shop near UBC..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAssistant(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssistant}
                disabled={!assistantPrompt.trim()}
                className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
