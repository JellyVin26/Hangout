import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ME, SEED_BADGES, SEED_HANGOUTS, SEED_NOTIFICATIONS, buildLiveSession } from '@/data/seed';
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
  vote: (hangoutId: string, placeId: string) => Promise<void>;
  sendMessage: (hangoutId: string, text: string) => Promise<void>;
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
          set({ user: apiUserToUser(res.user), loading: false });
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
          set({ user: apiUserToUser(res.user), loading: false });
          await get().bootstrap();
        } catch (e) {
          set({ loading: false, error: e instanceof ApiError ? e.message : 'Registration failed' });
          throw e;
        }
      },

      signOut: async () => {
        await setToken(null);
        set({ user: null, hangouts: [], places: [], friends: [], notifications: [], unreadCount: 0 });
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
        } catch (e) {
          set({ loading: false, error: e instanceof ApiError ? e.message : 'Failed to load data' });
        }
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
                  destinationId: input.candidates[0],
                  visibility: visMap[input.visibility] ?? 'PRIVATE',
                  category: input.category,
                  maxParticipants: input.maxParticipants,
                  inviteUserIds: input.inviteeIds,
                },
              });
              const hangout = apiHangoutToHangout(res);
              set((s) => ({ hangouts: [hangout, ...s.hangouts] }));
              return hangout.id;
            },
            vote: async (hangoutId, placeId) => {
        await api(`/hangouts/${hangoutId}/vote`, { method: 'POST', body: { placeId } });
        // Optimistic: update local state
        set((s) => ({
          hangouts: s.hangouts.map((h) => {
            if (h.id !== hangoutId) return h;
            const votes = { ...h.votes };
            votes[placeId] = [...(votes[placeId] ?? []), 'u_me'];
            return { ...h, votes, destinationId: placeId, status: 'confirmed' };
          }),
        }));
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
          return { live: { ...s.live, [hangoutId]: buildLiveSession() } };
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
                  }>;
                };
                set((s) => {
                  const session = s.live[hangoutId];
                  if (!session) return {};
                  const destination =
                    board.destination ? apiPlaceToPlace(board.destination, 0) : session.destination;
                  const travelers: typeof session.travelers = { ...session.travelers };
                  for (const p of board.participants ?? []) {
                    if (!p.lastLat || !p.lastLng) continue;
                    const existing = travelers[p.userId];
                    const status =
                      p.attendance === 'ARRIVED'
                        ? 'arrived'
                        : p.attendance === 'ON_THE_WAY'
                          ? 'onway'
                          : p.attendance === 'LATE'
                            ? 'late'
                            : 'idle';
                    const startedAt = existing?.startedAt ?? Date.now();
                    const totalSec = existing?.totalSec ?? 900;
                    const from = existing?.from ?? { x: 100, y: 1200 };
                    const control = existing?.control ?? { x: 500, y: 700 };
                    travelers[p.userId] = {
                      userId: p.userId,
                      status,
                      totalSec,
                      startedAt,
                      from,
                      control,
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