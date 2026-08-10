/**
 * Maps backend DTOs (from Hangout API) to the mobile domain types in @/data/types.
 */
import type {
  ArrivalStatus,
  Badge,
  Category,
  Hangout,
  HangoutStatus,
  Message,
  NotificationItem,
  NotificationKind,
  Participant,
  Photo,
  Place,
  User,
  Visibility,
} from '@/data/types';

/* ---------- API DTO shapes (subset of what the backend returns) ---------- */

export interface ApiUser {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface ApiPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  photoUrl?: string | null;
  openHours?: string | null;
}

export interface ApiParticipant {
  userId: string;
  status: string; // INVITED | JOINED | DECLINED | MAYBE
  attendance: string; // NOT_STARTED | ON_THE_WAY | ARRIVED | LEFT
  sharing: string; // NONE | LIVE | PRECISE
  lastLat?: number | null;
  lastLng?: number | null;
  user?: ApiUser;
}

export interface ApiHangout {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string; // ISO
  durationMin: number;
  destinationId?: string | null;
  visibility: string;
  maxParticipants?: number | null;
  category: string;
  hostId: string;
  createdAt: string;
  destination?: ApiPlace | null;
  host?: ApiUser | null;
  participants: ApiParticipant[];
  _count?: { messages?: number; votes?: number };
}

export interface ApiMessage {
  id: string;
  hangoutId: string;
  authorId: string;
  body: string;
  kind: string; // text | system
  createdAt: string;
}

export interface ApiMessage {
  id: string;
  hangoutId: string;
  authorId: string;
  body: string;
  kind: string;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface ApiNotification {
  id: string;
  type: string; // FRIEND_JOINED | REMINDER | VOTE | ...
  title?: string;
  body?: string;
  payload?: any;
  read: boolean;
  createdAt: string;
}

export interface ApiNotificationsResponse {
  items: ApiNotification[];
  unreadCount: number;
}

export interface ApiFriend {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

/* ============================ mappers ============================ */

export function apiUserToUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.displayName,
    username: u.username,
    bio: u.bio ?? undefined,
    color: '#F0522F',
    initials: initials(u.displayName),
    interests: [],
    badgeIds: [],
    hangoutCount: 0,
    placeCount: 0,
    friendIds: [],
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

const CATEGORY_MAP: Record<string, Category> = {
  Cafe: 'Cafe',
  Food: 'Food',
  Shopping: 'Shopping',
  Sports: 'Sports',
  Gaming: 'Gaming',
  Hiking: 'Hiking',
  Nightlife: 'Nightlife',
  Study: 'Study',
  Travel: 'Travel',
};

export function toCategory(c: string): Category {
  return CATEGORY_MAP[c] ?? 'Food';
}

export function apiPlaceToPlace(p: ApiPlace, index = 0): Place {
  return {
    id: p.id,
    name: p.name,
    category: toCategory(p.category),
    address: p.address,
    rating: p.rating,
    reviewCount: p.reviewCount,
    priceLevel: Math.min(3, Math.max(1, p.priceLevel)) as 1 | 2 | 3,
    photo: p.photoUrl ?? '',
    hours: p.openHours ?? '',
    distanceKm: (p as any).distanceKm ?? 0,
    tags: (p as any).tags ?? [],
    map: { x: (index * 137) % 900 + 50, y: ((index * 211) % 1200) + 80 },
  };
}

export function apiParticipantToParticipant(p: ApiParticipant): Participant {
  const statusMap: Record<string, ArrivalStatus> = {
    ARRIVED: 'arrived',
    ON_THE_WAY: 'onway',
    NOT_STARTED: 'idle',
  };
  return {
    userId: p.userId,
    role: 'member',
    rsvp: p.status === 'JOINED' ? 'going' : p.status === 'DECLINED' ? 'declined' : p.status === 'MAYBE' ? 'maybe' : 'invited',
    status: statusMap[p.attendance] ?? 'idle',
  };
}

export function apiHangoutToHangout(h: ApiHangout): Hangout {
  const participants = h.participants.map(apiParticipantToParticipant);
  const hostIsParticipant = participants.some((p) => p.userId === h.hostId);
  const finalParticipants = hostIsParticipant
    ? participants.map((p) => (p.userId === h.hostId ? { ...p, role: 'host' as const } : p))
    : h.host
      ? [{ userId: h.hostId, role: 'host' as const, rsvp: 'going' as const, status: 'idle' as const }, ...participants]
      : participants;
  const now = Date.now();
  const at = new Date(h.startsAt).getTime();
  const statusFromTime: HangoutStatus =
    at <= now - 2 * 3600_000 ? 'archived' : at <= now ? 'live' : h.visibility === 'PRIVATE' && participants.length <= 1 ? 'voting' : 'confirmed';

  return {
    id: h.id,
    title: h.title,
    description: h.description ?? undefined,
    at,
    durationMin: h.durationMin ?? 120,
    category: toCategory(h.category),
    visibility: (h.visibility?.toLowerCase() ?? 'private') as Visibility,
    maxParticipants: h.maxParticipants ?? undefined,
    hostId: h.hostId,
    status: statusFromTime,
    destinationId: h.destinationId ?? undefined,
    candidates: h.destination ? [h.destinationId!] : (h.destinationId ? [h.destinationId] : []),
    votes: {},
    participants: finalParticipants,
    messages: [],
    photos: [],
    createdAt: new Date(h.createdAt).getTime(),
    locationSharing: h.participants.some((p) => p.sharing !== 'NONE'),
  };
}

export function apiMessageToMessage(m: ApiMessage): Message {
  const kind = m.kind.toUpperCase();
  return {
    id: m.id,
    authorId: m.authorId,
    text: kind === 'TEXT' || kind === 'SYSTEM' ? m.body : undefined,
    image: kind === 'IMAGE' ? m.body : undefined,
    at: Date.parse(m.createdAt),
    kind: kind === 'IMAGE' ? 'image' : kind === 'SYSTEM' ? 'system' : 'text',
  };
}

export function apiNotificationToNotification(n: ApiNotification): NotificationItem {
  const kindMap: Record<string, NotificationKind> = {
    FRIEND_JOINED: 'friend_joined',
    REMINDER: 'reminder',
    VOTE: 'vote',
    SYSTEM: 'system',
  };

  return {
    id: n.id,
    kind: kindMap[n.type] ?? 'system',
    title: n.title ?? n.type.replace(/_/g, ' ').toLowerCase(),
    body: n.body ?? '',
    at: Date.parse(n.createdAt),
    read: n.read,
    hangoutId: n.payload?.hangoutId,
  };
}

export function apiFriendToUser(f: ApiFriend): User {
  return {
    id: f.id,
    name: f.displayName,
    username: f.username,
    bio: f.bio ?? undefined,
    color: '#F0522F',
    initials: initials(f.displayName),
    interests: [],
    badgeIds: [],
    hangoutCount: 0,
    placeCount: 0,
    friendIds: [],
  };
}