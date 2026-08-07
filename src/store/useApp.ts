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
  NotificationItem,
  Place,
  SharingMode,
  User,
} from '@/data/types';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  user: User | null;
  signIn: () => void;
  signOut: () => void;

  hangouts: Hangout[];
  createHangout: (input: CreateHangoutInput) => string;
  vote: (hangoutId: string, placeId: string) => void;
  sendMessage: (hangoutId: string, text: string) => void;
  addPhoto: (hangoutId: string, uri: string) => void;
  setParticipantStatus: (hangoutId: string, userId: string, status: ArrivalStatus) => void;

  live: Record<string, LiveSession>;
  startLive: (hangoutId: string) => void;
  setSharing: (hangoutId: string, mode: SharingMode) => void;

  notifications: NotificationItem[];
  markAllRead: () => void;
  pushNotification: (n: Omit<NotificationItem, 'id' | 'at' | 'read'>) => void;

  badges: Badge[];
  places: Place[];
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
      signIn: () => set({ user: { ...ME } }),
      signOut: () => set({ user: null }),

      hangouts: SEED_HANGOUTS,
      createHangout: (input) => {
        const id = uid();
        const hangout: Hangout = {
          id,
          title: input.title,
          description: input.description,
          at: input.at,
          durationMin: input.durationMin,
          category: input.category,
          visibility: input.visibility,
          maxParticipants: input.maxParticipants,
          hostId: 'u_me',
          status: input.candidates.length > 1 ? 'voting' : 'confirmed',
          destinationId: input.candidates.length === 1 ? input.candidates[0] : undefined,
          candidates: input.candidates,
          votes: {},
          participants: [
            { userId: 'u_me', role: 'host', rsvp: 'going', status: 'idle' },
            ...input.inviteeIds.map((uid_) => ({
              userId: uid_,
              role: 'member' as const,
              rsvp: 'invited' as const,
              status: 'idle' as const,
            })),
          ],
          messages: [
            {
              id: uid(),
              authorId: 'system',
              text: `${input.title} is on the calendar`,
              at: Date.now(),
              kind: 'system',
            },
          ],
          photos: [],
          createdAt: Date.now(),
          locationSharing: false,
        };
        set((s) => ({ hangouts: [hangout, ...s.hangouts] }));
        return id;
      },
      vote: (hangoutId, placeId) => {
        set((s) => ({
          hangouts: s.hangouts.map((h) => {
            if (h.id !== hangoutId) return h;
            const votes = { ...h.votes };
            Object.keys(votes).forEach((k) => {
              votes[k] = votes[k].filter((u) => u !== 'u_me');
            });
            const list = votes[placeId] ?? [];
            votes[placeId] = [...list, 'u_me'];
            // Auto-resolve when a candidate reaches a majority of going participants
            const going = h.participants.filter((p) => p.rsvp !== 'invited').length;
            const resolved = Object.entries(votes).find(([, users]) => users.length * 2 >= going);
            if (resolved) {
              return {
                ...h,
                votes,
                status: 'confirmed' as const,
                destinationId: resolved[0],
                messages: [
                  ...h.messages,
                  {
                    id: uid(),
                    authorId: 'system',
                    text: `Destination locked: ${resolved[0]}`,
                    at: Date.now(),
                    kind: 'system',
                  },
                ],
              };
            }
            return { ...h, votes };
          }),
        }));
      },
      sendMessage: (hangoutId, text) => {
        set((s) => ({
          hangouts: s.hangouts.map((h) =>
            h.id === hangoutId
              ? {
                  ...h,
                  messages: [
                    ...h.messages,
                    { id: uid(), authorId: 'u_me', text, at: Date.now(), kind: 'text' },
                  ],
                }
              : h
          ),
        }));
      },
      addPhoto: (hangoutId, uri) => {
        set((s) => ({
          hangouts: s.hangouts.map((h) =>
            h.id === hangoutId
              ? {
                  ...h,
                  photos: [
                    ...h.photos,
                    { id: uid(), uri, by: 'u_me', at: Date.now(), likes: 0 },
                  ],
                }
              : h
          ),
        }));
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

      notifications: SEED_NOTIFICATIONS,
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
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
