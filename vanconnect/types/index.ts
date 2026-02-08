// Shared types for frontend and backend
// Import this file in both client and server code to ensure type safety

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  preferences?: UserPreferences;
  activeGroupId?: string;
}

export interface UserPreferences {
  // Step 1 – goal
  goal: 'study' | 'sustainable' | 'outdoors';
  // Step 2 – transport
  transport: 'transit' | 'biking' | 'walking' | 'carpool';
  // Step 3 – vibe
  energy: 'chill' | 'balanced' | 'active';
  interests: string[];

  /* ---- legacy / back-compat (kept so other pages don't break) ---- */
  activity: string;
  vibe: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  availability: string[];
  sustainability: string[];
}

export interface PersonCard {
  id: string;
  name: string;
  year: string;
  tags: string[];
  vibe: string;
  energy: string;
  photoUrl?: string;
}

export interface Group {
  id: string;
  members: User[];
  activity: string;
  vibe: string;
  createdAt: string;
}

export interface Event {
  id: string;
  groupId: string;
  title: string;
  startTime: string;
  endTime: string;
  locationName: string;
  locationLatLng?: { lat: number; lng: number };
  transitHint?: string;
  badges: string[];
}

export interface Message {
  id: string;
  groupId: string;
  senderId?: string;
  senderType: 'user' | 'assistant';
  text: string;
  createdAt: string;
  senderName?: string;
  senderPhoto?: string;
}

export type SwipeDecision = 'like' | 'pass';

export interface SwipeResponse {
  ok: boolean;
  groupId?: string;
}

export interface MeResponse {
  user: User;
  preferences?: UserPreferences;
  activeGroupId?: string;
}
