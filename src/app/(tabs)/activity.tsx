import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, CheckCircle, ChatCircleDots, Clock, Trophy, UserPlus, WarningCircle } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { timeAgo } from '@/lib/format';
import { Screen, EmptyState } from '@/components/Screen';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

const kindIcon = (kind: string) => {
  switch (kind) {
    case 'friend_joined':
      return { icon: UserPlus, color: '#2F6FED', bg: 'rgba(47,111,237,0.12)' };
    case 'friend_declined':
      return { icon: WarningCircle, color: '#D64545', bg: 'rgba(214,69,69,0.12)' };
    case 'reminder':
      return { icon: Clock, color: '#C77E00', bg: 'rgba(199,126,0,0.14)' };
    case 'vote':
      return { icon: CheckCircle, color: '#1F9D5C', bg: 'rgba(31,157,92,0.12)' };
    case 'late':
      return { icon: WarningCircle, color: '#C77E00', bg: 'rgba(199,126,0,0.14)' };
    case 'arrived':
      return { icon: CheckCircle, color: '#1F9D5C', bg: 'rgba(31,157,92,0.12)' };
    case 'chat':
      return { icon: ChatCircleDots, color: '#F0522F', bg: 'rgba(240,82,47,0.12)' };
    case 'cancel':
      return { icon: WarningCircle, color: '#D64545', bg: 'rgba(214,69,69,0.12)' };
    case 'system':
      return { icon: Trophy, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' };
    default:
      return { icon: Clock, color: '#9C928A', bg: 'rgba(156,146,138,0.14)' };
  }
};

export default function ActivityScreen() {
  const p = usePalette();
  const router = useRouter();
  const notifications = useApp((s) => s.notifications);
  const markAllRead = useApp((s) => s.markAllRead);
  const refreshNotifications = useApp((s) => s.refreshNotifications);

  useEffect(() => {
    refreshNotifications();
  }, []);

  const grouped = notifications.reduce<Record<string, typeof notifications>>((acc, n) => {
    const d = new Date(n.at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (acc[key] ??= []).push(n);
    return acc;
  }, {});

  const groups = Object.entries(grouped).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <Screen
      header={{
        title: 'Activity',
        right: (
          <Ty variant="bodySmall" color={p.accent} style={{ fontWeight: '700' }} onPress={markAllRead}>
            Mark read
          </Ty>
        ),
      }}
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Ph name="Bell" size={30} weight="duotone" color={p.inkFaint} />}
          title="Nothing yet"
          body="Friend updates, reminders and arrival alerts will show up here."
        />
      ) : (
        <View style={{ gap: space.xxl }}>
          {groups.map(([day, items]) => (
            <View key={day}>
              <Ty variant="caption" faint style={{ textTransform: 'uppercase', marginBottom: space.sm }}>
                {new Date(items[0].at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </Ty>
              <View style={{ gap: space.sm }}>
                {items.map((n) => {
                  const meta = kindIcon(n.kind);
                  return (
                    <View
                      key={n.id}
                      style={{
                        flexDirection: 'row',
                        gap: space.md,
                        alignItems: 'center',
                        paddingVertical: space.sm,
                        opacity: n.read ? 0.62 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          backgroundColor: meta.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <meta.icon size={20} weight="duotone" color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ty variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                            {n.title}
                          </Ty>
                          {!n.read ? (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.accent }} />
                          ) : null}
                        </View>
                        <Ty variant="bodySmall" muted numberOfLines={2}>
                          {n.body}
                        </Ty>
                        <Ty variant="caption" faint style={{ marginTop: 2 }}>
                          {timeAgo(n.at)}
                        </Ty>
                      </View>
                      {n.hangoutId ? (
                        <Pressable onPress={() => router.push(`/hangout/${n.hangoutId}`)} hitSlop={8}>
                          <ArrowUpRight size={18} weight="bold" color={p.inkFaint} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
