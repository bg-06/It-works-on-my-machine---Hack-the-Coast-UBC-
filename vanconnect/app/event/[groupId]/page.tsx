'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Group, Event } from '@/types';
import Image from 'next/image';

type GroupDetails = Group & {
  eventTime?: string | null;
  locationName?: string;
};

const buildFallbackEvent = (groupId: string, groupData?: Partial<GroupDetails>) => {
  let start = groupData?.eventTime ? new Date(groupData.eventTime) : new Date();
  if (Number.isNaN(start.getTime())) {
    start = new Date();
  }
  if (!groupData?.eventTime) {
    start.setDate(start.getDate() + 1);
    start.setHours(14, 0, 0, 0);
  }
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const locationName = groupData?.locationName || 'Vancouver – TBD';
  const transitHint = 'Take the SkyTrain or bike over!';

  return {
    id: `evt-${groupId}`,
    groupId,
    title: groupData?.activity ? `🌿 ${groupData.activity}` : '🌿 Sustainable Meetup',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    locationName,
    transitHint,
    badges: ['Low Carbon', 'Local Business'],
  };
};

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const fetchGroupData = async () => {
      try {
        // Try to fetch group details
        const res = await fetch(`/api/group?groupId=${groupId}`);
        if (res.ok) {
          const data = await res.json();
          const groupData = data.group ?? data;
          setGroup(groupData);
          setEvent(data.event ?? buildFallbackEvent(groupId, groupData));
        } else {
          // Fallback: build a placeholder group/event from the groupId
          const fallbackGroup: GroupDetails = {
            id: groupId,
            members: [
              { id: 'you', name: 'You', email: '' },
              { id: 'match', name: 'Your Match', email: '' },
            ],
            activity: 'Sustainable Hangout',
            vibe: 'balanced',
            createdAt: new Date().toISOString(),
          };
          setGroup(fallbackGroup);

          // Try to get a suggested location for the event
          let locationName = 'Vancouver – TBD';
          try {
            const locRes = await fetch('/api/location/suggest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ groupId }),
            });
            if (locRes.ok) {
              const loc = await locRes.json();
              if (loc?.name) locationName = loc.name;
            }
          } catch { /* ignore */ }

          setEvent(buildFallbackEvent(groupId, { ...fallbackGroup, locationName }));
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setGroup(null);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  const addToCalendar = async () => {
    setAddingToCalendar(true);
    try {
      alert('Calendar integration coming soon! For now, save the date manually.');
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      alert('Calendar integration coming soon! For now, save the date manually.');
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
            {event.badges && event.badges.length > 0 && (
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
              onClick={() => router.push(`/chat?groupId=${groupId}`)}
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
