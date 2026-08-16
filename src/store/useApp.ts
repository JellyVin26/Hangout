import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ME, SEED_BADGES, SEED_HANGOUTS, SEED_NOTIFICATIONS } from '@/data/seed';
import { palettes } from '@/theme/tokens';
import type {
  ArrivalStatus,
  Badge,
  CreateHangoutInput,
  Hangout,
  LiveSession,
  Message,
  NotificationItem,
  Place,
  SharingMode,
  User,
} from '@/data/types';
import { api, setToken, ApiError } from '@/lib/api';
import { capturePostHog, identifyPostHog } from '@/lib/posthog';
import {
  apiUserToUser,
  apiPlaceToPlace,
  apiHangoutToHangout,
  apiNotificationToNotification,
  apiFriendToUser,
  apiMessageToMessage,
  type ApiHangout,
  type ApiMessage,
  type ApiNotificationsResponse,
} from '@/data/transform';

/** Merge existing + fetched messages, dedupe by id, sort by time. */
function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const seen = new Set<string>();
  return [...incoming, ...current]
    .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .sort((a, b) => a.at - b.at);
}


interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  user: User | null;
  signIn: (email?: string, password?: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  bootstrap: () => Promise<void>;

  loading: boolean;
  error: string | null;

  hangouts: Hangout[];
  createHangout: (input: CreateHangoutInput) => Promise<string>;
  loadHangout: (hangoutId: string) => Promise<void>;
  vote: (hangoutId: string, placeId: string) => Promise<void>;
  rsvp: (hangoutId: string, status: 'going' | 'declined') => Promise<void>;
  sendMessage: (hangoutId: string, text: string) => Promise<void>;
  sendCheckIn: (hangoutId: string, kind: 'on_way' | 'late' | 'arrived') => Promise<void>;
  refreshMessages: (hangoutId: string) => Promise<void>;
  addPhoto: (hangoutId: string, uri: string) => void;
  setParticipantStatus: (hangoutId: string, userId: string, status: ArrivalStatus) => void;

  live: Record<string, LiveSession>;
    startLive: (hangoutId: string) => void;
    setSharing: (hangoutId: string, mode: SharingMode) => void;
    refreshLiveBoard: (hangoutId: string) => Promise<void>;

  notifications: NotificationItem[];
    unreadCount: number;
    refreshNotifications: () => Promise<void>;
    markAllRead: () => Promise<void>;
    pushNotification: (n: Omit<NotificationItem, 'id' | 'at' | 'read'>) => void;

  badges: Badge[];
  places: Place[];
  friends: User[];
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  refreshFriends: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  respondFriendRequest: (requestId: string, accept: boolean) => Promise<void>;
}

export interface FriendRequest {
  id: string;
  user: User;
  createdAt: number;
}

let idCounter = 100;
function uid(): string {
  idCounter += 1;
  return `gen_${idCounter}_${Date.now().toString(36)}`;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      user: null,
      loading: false,
      error: null,

      signIn: async (email?: string, password?: string) => {
        set({ loading: true, error: null });
        try {
          // If no credentials, use demo account
          const creds = email && password
            ? { email, password }
            : { email: 'maya@hangout.app', password: 'password123' };
          const res = await api<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: creds,
            token: null, // no token for login
          });
          await setToken(res.token);
          const user = apiUserToUser(res.user);
          identifyPostHog(user.id, { username: user.username, displayName: user.name });
          capturePostHog('user_signed_in', { method: email && password ? 'password' : 'demo' });
          set({ user, loading: false });
          await get().bootstrap();
        } catch (e) {
          set({ loading: false, error: e instanceof ApiError ? e.message : 'Login failed' });
          throw e;
        }
      },

      signUp: async (name: string, email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const res = await api<{ token: string; user: any }>('/auth/register', {
            method: 'POST',
            body: { email, password, username: email.split('@')[0], displayName: name },
            token: null,
          });
          await setToken(res.token);
          const user = apiUserToUser(res.user);
          identifyPostHog(user.id, { username: user.username, displayName: user.name });
          capturePostHog('user_signed_up');
          set({ user, loading: false });
          await get().bootstrap();
        } catch (e) {
          set({ loading: false, error: e instanceof ApiError ? e.message : 'Registration failed' });
          throw e;
        }
      },

      signOut: async () => {
        await setToken(null);
        set({ user: null, hangouts: [], places: [], friends: [], friendRequests: { incoming: [], outgoing: [] }, notifications: [], unreadCount: 0 });
      },

      bootstrap: async () => {
        set({ loading: true, error: null });
        try {
          const [profile, hangouts, placesRes, friendsRes, notifRes] = await Promise.all([
            api<any>('/auth/me'),
            api<ApiHangout[]>('/hangouts'),
            api<any[]>('/places'),
            api<any[]>('/friends'),
            api<ApiNotificationsResponse>('/notifications'),
          ]);

          set({
            user: apiUserToUser(profile),
            hangouts: hangouts.map(apiHangoutToHangout),
            places: placesRes.map((p, i) => apiPlaceToPlace(p, i)),
            friends: friendsRes.map(apiFriendToUser),
            notifications: notifRes.items?.map(apiNotificationToNotification) ?? [],
            unreadCount: notifRes.unreadCount ?? 0,
            loading: false,
          });
          void get().refreshFriends();
        } catch (e) {
          set({ loading: false, error: e instanceof ApiError ? e.message : 'Failed to load data' });
        }
      },

      refreshFriends: async () => {
        try {
          const [friendsRes, reqs] = await Promise.all([
            api<any[]>('/friends'),
            api<{ incoming: any[]; outgoing: any[] }>('/friends/requests'),
          ]);
          const incoming = (reqs.incoming ?? []).map((r) => ({
            id: r.id,
            createdAt: Date.parse(r.createdAt ?? '') || Date.now(),
            user: apiFriendToUser(r.user),
          }));
          const outgoing = (reqs.outgoing ?? []).map((r) => ({
            id: r.id,
            createdAt: Date.parse(r.createdAt ?? '') || Date.now(),
            user: apiFriendToUser(r.user),
          }));
          set({
            friends: friendsRes.map(apiFriendToUser),
            friendRequests: { incoming, outgoing },
          });
        } catch {
          // offline ok
        }
      },
      sendFriendRequest: async (userId) => {
        await api('/friends/requests', { method: 'POST', body: { userId } });
        await get().refreshFriends();
      },
      respondFriendRequest: async (requestId, accept) => {
        await api(`/friends/requests/${requestId}/${accept ? 'accept' : 'decline'}`, { method: 'POST' });
        await get().refreshFriends();
      },

      hangouts: SEED_HANGOUTS,
            createHangout: async (input) => {
              const startsAt = new Date(input.at).toISOString();
              const visMap: Record<string, string> = {
                private: 'PRIVATE',
                friends: 'FRIENDS_ONLY',
                public: 'PUBLIC',
              };
              const res = await api<ApiHangout>('/hangouts', {
                              method: 'POST',
                              body: {
                                title: input.title,
                                description: input.description,
                                startsAt,
                                destinationId: input.candidates.length === 1 ? input.candidates[0] : undefined,
                                candidatePlaceIds: input.candidates.length > 1 ? input.candidates : undefined,
                                visibility: visMap[input.visibility] ?? 'PRIVATE',
                                category: input.category,
                                maxParticipants: input.maxParticipants,
                                inviteUserIds: input.inviteeIds,
                              },
                            });
              const hangout = apiHangoutToHangout(res);
              capturePostHog('hangout_created', {
                hangoutId: hangout.id,
                hasDestination: Boolean(hangout.destinationId),
                inviteeCount: input.inviteeIds.length,
                visibility: input.visibility,
              });
              set((s) => {
                const destination = res.destination ? apiPlaceToPlace(res.destination) : null;
                return {
                  hangouts: [hangout, ...s.hangouts],
                  places: destination && !s.places.some((p) => p.id === destination.id)
                    ? [destination, ...s.places]
                    : s.places,
                };
              });
              return hangout.id;
            },
            loadHangout: async (hangoutId) => {
              const res = await api<ApiHangout>(`/hangouts/${hangoutId}`);
              const hangout = apiHangoutToHangout(res);
              const destination = res.destination ? apiPlaceToPlace(res.destination) : null;
              const users = [res.host, ...(res.participants ?? []).map((p) => p.user)].filter(Boolean).map((u) => apiUserToUser(u!));
              set((s) => ({
                hangouts: s.hangouts.some((h) => h.id === hangoutId)
                  ? s.hangouts.map((h) => (h.id === hangoutId ? hangout : h))
                  : [hangout, ...s.hangouts],
                places: destination && !s.places.some((p) => p.id === destination.id)
                  ? [destination, ...s.places]
                  : s.places,
                friends: [...users.filter((u) => u.id !== s.user?.id && !s.friends.some((f) => f.id === u.id)), ...s.friends],
              }));
            },
            vote: async (hangoutId, placeId) => {
        await api(`/hangouts/${hangoutId}/vote`, { method: 'POST', body: { placeId } });
        capturePostHog('place_voted', { hangoutId, placeId });
        // Optimistic: update local state
        set((s) => ({
          hangouts: s.hangouts.map((h) => {
            if (h.id !== hangoutId) return h;
            const votes = { ...h.votes };
            const meId = get().user?.id;
            votes[placeId] = meId ? [...(votes[placeId] ?? []), meId] : (votes[placeId] ?? []);
            return { ...h, votes, destinationId: placeId, status: 'confirmed' };
          }),
        }));
      },
      rsvp: async (hangoutId, status) => {
        await api(`/hangouts/${hangoutId}/${status === 'going' ? 'join' : 'decline'}`, { method: 'POST' });
        capturePostHog('rsvp_changed', { hangoutId, status });
        set((s) => {
          const me = s.user;
          if (!me) return {};
          return {
            hangouts: s.hangouts.map((h) => {
              if (h.id !== hangoutId) return h;
              const participants = h.participants.some((p) => p.userId === me.id)
                ? h.participants.map((p) => (p.userId === me.id ? { ...p, rsvp: status } : p))
                : [...h.participants, { userId: me.id, role: 'member' as const, rsvp: status, status: 'idle' as const }];
              return { ...h, participants };
            }),
          };
        });
      },
      sendCheckIn: async (hangoutId, kind) => {
        const me = get().user;
        const myName = me?.name ?? 'Someone';
        const labels: Record<string, string> = {
          on_way: `${myName} is on the way! 🚗`,
          late: `${myName} is running ~10 min late ⏳`,
          arrived: `${myName} has arrived! 📍`,
        };
        const text = labels[kind] ?? `${myName} checked in`;
        const attendanceMap: Record<string, ArrivalStatus> = {
          on_way: 'onway',
          late: 'late',
          arrived: 'arrived',
        };
        const newStatus = attendanceMap[kind] ?? 'idle';

        // Optimistic: add system message & update participant arrival status
        const tempId = uid();
        set((s) => ({
          hangouts: s.hangouts.map((h) =>
            h.id === hangoutId
              ? {
                  ...h,
                  messages: [
                    ...h.messages,
                    { id: tempId, authorId: me?.id ?? 'me', text, at: Date.now(), kind: 'system' as const },
                  ],
                  participants: h.participants.map((p) =>
                    p.userId === me?.id ? { ...p, status: newStatus } : p
                  ),
                }
              : h
          ),
        }));

        try {
          await api(`/hangouts/${hangoutId}/messages`, {
            method: 'POST',
            body: { body: text, kind: 'SYSTEM' },
          });
          capturePostHog('checkin_sent', { hangoutId, kind });
        } catch {
          // optimistic message stays
        }
      },
      sendMessage: async (hangoutId, text) => {
        // Optimistic update
        const tempId = uid();
              set((s) => ({
                hangouts: s.hangouts.map((h) =>
                  h.id === hangoutId
                    ? {
                        ...h,
                        messages: [
                          ...h.messages,
                          { id: tempId, authorId: get().user?.id ?? 'me', text, at: Date.now(), kind: 'text' as const },
                        ],
                      }
                    : h
                ),
              }));
              try {
                              await api(`/hangouts/${hangoutId}/messages`, { method: 'POST', body: { body: text } });
                              capturePostHog('message_sent', { hangoutId, kind: 'text' });
                            } catch {
                // mark as failed? for now leave optimistic message
              }
            },
            refreshMessages: async (hangoutId) => {
              try {
                const res = (await api(`/hangouts/${hangoutId}/messages`)) as { data?: ApiMessage[] } | ApiMessage[];
                const list = Array.isArray(res) ? res : (res as any).data ?? [];
                const mapped = (list as ApiMessage[]).map(apiMessageToMessage);
                set((s) => ({
                  hangouts: s.hangouts.map((h) =>
                    h.id === hangoutId
                      ? { ...h, messages: mergeMessages(h.messages, mapped) }
                      : h
                  ),
                }));
              } catch {
                // network error — keep local state
              }
            },
      addPhoto: (hangoutId, uri) => {
              set((s) => ({
                hangouts: s.hangouts.map((h) =>
                  h.id === hangoutId
                    ? {
                        ...h,
                        photos: [
                          ...h.photos,
                          { id: uid(), uri, by: get().user?.id ?? 'me', at: Date.now(), likes: 0 },
                        ],
                      }
                    : h
                ),
              }));
              void api(`/hangouts/${hangoutId}/memories`, {
                method: 'POST',
                body: { url: uri, kind: 'PHOTO' },
              }).catch(() => undefined);
            },
      setParticipantStatus: (hangoutId, userId, status) => {
        set((s) => ({
          hangouts: s.hangouts.map((h) =>
            h.id === hangoutId
              ? {
                  ...h,
                  participants: h.participants.map((p) =>
                    p.userId === userId ? { ...p, status } : p
                  ),
                }
              : h
          ),
        }));
      },

      live: {},
      startLive: (hangoutId) => {
        set((s) => {
          if (s.live[hangoutId]) return {};
          const hangout = s.hangouts.find((h) => h.id === hangoutId);
          const destination =
            (hangout?.destinationId ? s.places.find((pl) => pl.id === hangout.destinationId) : null) ??
            ({
              id: '',
              name: '',
              category: '',
              address: '',
              rating: 0,
              reviewCount: 0,
              priceLevel: 1,
              photo: '',
              hours: '',
              distanceKm: 0,
              tags: [],
              map: { x: 0, y: 0 },
              lat: undefined,
              lng: undefined,
            } satisfies Place);
          return {
            live: {
              ...s.live,
              [hangoutId]: {
                hangoutId,
                startedAt: Date.now(),
                destination,
                travelers: {},
                me: { sharing: 'none', totalSec: 480, from: { x: 210, y: 1050 }, control: { x: 320, y: 820 } },
              },
            },
          };
        });
      },
      setSharing: (hangoutId, mode) => {
              set((s) => {
                const session = s.live[hangoutId];
                if (!session) return {};
                return {
                  live: {
                    ...s.live,
                    [hangoutId]: {
                      ...session,
                      me: {
                        ...session.me,
                        sharing: mode,
                        startedAt: mode === 'none' ? undefined : Date.now(),
                      },
                    },
                  },
                };
              });
            },
            refreshLiveBoard: async (hangoutId) => {
              try {
                const board = (await api(`/hangouts/${hangoutId}/live/board`)) as {
                            destination?: {
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
                            };
                  participants?: Array<{
                    userId: string;
                    attendance: string;
                    sharing: string;
                    lastLat: number | null;
                    lastLng: number | null;
                    distanceKm?: number | null;
                    etaMin?: number | null;
                  }>;
                };
                set((s) => {
                  const session = s.live[hangoutId];
                  if (!session) return {};
                  const destination =
                    board.destination ? apiPlaceToPlace(board.destination, 0) : session.destination;
                  const travelers: typeof session.travelers = {};
                  for (const p of board.participants ?? []) {
                    const status =
                      p.attendance === 'ARRIVED'
                        ? 'arrived'
                        : p.attendance === 'ON_THE_WAY'
                          ? 'onway'
                          : p.attendance === 'LATE'
                            ? 'late'
                            : 'idle';
                    // Real server-computed ETA (km at 5 km/h walking) when we have a GPS fix;
                    // otherwise default to a 15-min journey so the row still shows sane info.
                    const etaMin = p.etaMin ?? null;
                    const totalSec = etaMin != null && etaMin > 0 ? etaMin * 60 : 900;
                    travelers[p.userId] = {
                      userId: p.userId,
                      status,
                      totalSec,
                      distanceKm: p.distanceKm ?? undefined,
                      startedAt: Date.now(),
                      from: { x: 100, y: 1200 },
                      control: { x: 500, y: 700 },
                      lat: p.lastLat ?? undefined,
                      lng: p.lastLng ?? undefined,
                    };
                  }
                  return {
                    live: {
                      ...s.live,
                      [hangoutId]: { ...session, travelers, destination },
                    },
                  };
                });
              } catch {
                // offline ok
              }
            },

            notifications: SEED_NOTIFICATIONS,
                  unreadCount: 0,
                  refreshNotifications: async () => {
                    try {
                      const res = await api<ApiNotificationsResponse>('/notifications');
                      set({
                        notifications: res.items?.map(apiNotificationToNotification) ?? [],
                        unreadCount: res.unreadCount ?? 0,
                      });
                    } catch {
                      /* offline ok */
                    }
                  },
                  markAllRead: async () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        try {
          await api('/notifications/read-all', { method: 'POST' });
        } catch {
          /* offline ok */
        }
      },
      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              id: uid(),
              at: Date.now(),
              read: false,
              ...n,
            },
            ...s.notifications,
          ],
        })),

      badges: SEED_BADGES,
      places: [],
      friends: [],
      friendRequests: { incoming: [], outgoing: [] },
    }),
    {
      name: 'hangout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ theme: s.theme, user: s.user }),
    }
  )
);

/** Read-only selectors with useSyncExternalStore semantics via zustand. */
export const useTheme = () => {
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  return { theme, isDark: theme === 'dark', toggleTheme };
};

export const usePalette = () => {
  const isDark = useApp((s) => s.theme === 'dark');
  return isDark ? palettes.dark : palettes.light;
};

export function useLiveSession(hangoutId: string): LiveSession | undefined {
  return useApp((s) => s.live[hangoutId]);
}

/** Look up a user by id across self + friends + hangout participants. */
export function useUserById(id: string): User | undefined {
  const user = useApp((s) => s.user);
  const friends = useApp((s) => s.friends);
  const hangouts = useApp((s) => s.hangouts);
  if (user?.id === id) return user;
  const f = friends.find((x) => x.id === id);
  if (f) return f;
  // Search participants inside hangouts (denormalized enough for avatars)
  const pa = hangouts
    .flatMap((h) => h.participants.map((p) => p.userId))
    .find((uid) => uid === id);
  void pa;
  return undefined;
}

export function usePlaceById(id?: string): Place | undefined {
  const places = useApp((s) => s.places);
  if (!id) return undefined;
  return places.find((pl) => pl.id === id);
}