'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Group, Event } from '@/types';
import Image from 'next/image';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    fetch(`/api/groups/${groupId}`)
      .then(res => res.json())
      .then(data => {
        setGroup(data.group);
        setEvent(data.event);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch event:', err);
        setLoading(false);
      });
  }, [groupId]);

  const addToCalendar = async () => {
    setAddingToCalendar(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/calendar`, {
        method: 'POST',
      });
      const data = await res.json();
      alert('Event added to your Google Calendar!');
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      alert('Failed to add to calendar');
    } finally {
      setAddingToCalendar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (!group || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#056661] to-[#1b7e57] p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-teal-100">Your sustainable adventure awaits!</p>
          </div>

          {/* Members */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Going with</h2>
            <div className="flex gap-4">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-bold">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-700">Activity</div>
              <div className="text-lg text-gray-800">{group.activity}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700">When</div>
              <div className="text-lg text-gray-800">
                {new Date(event.startTime).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700">Where</div>
              <div className="text-lg text-gray-800">{event.locationName}</div>
              {event.transitHint && (
                <div className="text-sm text-gray-600 mt-1">🚌 {event.transitHint}</div>
              )}
            </div>

            {/* Sustainability Badges */}
            {event.badges.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Sustainability</div>
                <div className="flex flex-wrap gap-2">
                  {event.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      ♻️ {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 space-y-3">
            <button
              onClick={addToCalendar}
              disabled={addingToCalendar}
              className="w-full bg-[var(--primary)] text-white font-semibold py-4 px-6 rounded-lg hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-md"
            >
              {addingToCalendar ? 'Adding...' : '📅 Add to Google Calendar'}
            </button>

            <button
              onClick={() => router.push(`/chat/${groupId}`)}
              className="w-full bg-white border-2 border-[var(--primary)] text-[var(--primary)] font-semibold py-4 px-6 rounded-lg hover:bg-teal-50 transition-all shadow-md"
            >
              💬 Chat with your group
            </button>

            <button
              onClick={() => router.push('/swipe')}
              className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
            >
              Continue swiping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
