/** Domain types for Hangout. */

export type Category =
  | 'Cafe'
  | 'Food'
  | 'Shopping'
  | 'Sports'
  | 'Gaming'
  | 'Hiking'
  | 'Nightlife'
  | 'Study'
  | 'Travel';

export const CATEGORIES: Category[] = [
  'Cafe',
  'Food',
  'Shopping',
  'Sports',
  'Gaming',
  'Hiking',
  'Nightlife',
  'Study',
  'Travel',
];

export interface User {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string | null;
  color: string;
  initials: string;
  interests: string[];
  badgeIds: string[];
  hangoutCount: number;
  placeCount: number;
  friendIds: string[];
}

export interface Place {
  id: string;
  name: string;
  category: Category | string;
  address: string;
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3;
  photo: string;
  hours: string;
  distanceKm: number;
  tags: string[];
  /** Position on the stylized live-map canvas (0..1000 x 0..1400). */
  map: { x: number; y: number };
  /** Real-world coords when available (from Google Places). */
  lat?: number;
  lng?: number;
}

export type ArrivalStatus = 'arrived' | 'onway' | 'late' | 'idle';

export interface Participant {
  userId: string;
  role: 'host' | 'member';
  rsvp: 'going' | 'maybe' | 'declined' | 'invited';
  /** Arrival-coordination status. Only meaningful once the session is live. */
  status: ArrivalStatus;
  user?: { id: string; name: string; username: string; initials: string; color: string; avatarUrl?: string | null };
}

export type HangoutStatus = 'voting' | 'confirmed' | 'live' | 'archived';
export type Visibility = 'private' | 'friends' | 'public';

export interface PollMessage {
  question: string;
  options: string[];
  votes: Record<string, number>;
}

export interface Message {
  id: string;
  authorId: string;
  text?: string;
  image?: string;
  at: number;
  kind: 'text' | 'image' | 'system' | 'poll';
  poll?: PollMessage;
}

export interface Photo {
  id: string;
  uri: string;
  by: string;
  at: number;
  likes: number;
}

export interface Hangout {
  id: string;
  title: string;
  description?: string;
  at: number;
  durationMin: number;
  category: Category;
  visibility: Visibility;
  maxParticipants?: number;
  hostId: string;
  status: HangoutStatus;
  destinationId?: string;
  candidates: string[];
  votes: Record<string, string[]>;
  participants: Participant[];
  messages: Message[];
  photos: Photo[];
  createdAt: number;
  locationSharing: boolean;
}

export type NotificationKind =
  | 'invite'
  | 'friend_joined'
  | 'friend_declined'
  | 'reminder'
  | 'vote'
  | 'late'
  | 'arrived'
  | 'chat'
  | 'cancel'
  | 'system';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
  hangoutId?: string;
}

export interface Badge {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number;
}

/** Hero feature: a live arrival-coordination session for one hangout. */
export interface LiveTraveler {
  userId: string;
  status: ArrivalStatus;
  /** Total journey duration in seconds. */
  totalSec: number;
  /** Straight-line distance to destination in km (real GPS fix), when known. */
  distanceKm?: number;
  /** When this traveler's journey started (epoch ms). */
  startedAt: number;
  from: { x: number; y: number };
  control: { x: number; y: number };
  lat?: number;
  lng?: number;
}

export type SharingMode = 'live' | 'eta' | 'none';

export interface LiveSession {
  hangoutId: string;
  startedAt: number;
  travelers: Record<string, LiveTraveler>;
  me: {
    sharing: SharingMode;
    startedAt?: number;
    totalSec: number;
    from: { x: number; y: number };
    control: { x: number; y: number };
  };
  destination: Place;
}

export interface CreateHangoutInput {
  title: string;
  description?: string;
  at: number;
  durationMin: number;
  category: Category;
  visibility: Visibility;
  maxParticipants?: number;
  candidates: string[];
  inviteeIds: string[];
}
