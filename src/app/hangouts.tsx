import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { fmtDay, fmtTime } from '@/lib/format';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

type Tab = 'upcoming' | 'past' | 'archived';

export default function HangoutsListScreen() {
  const p = usePalette();
  const router = useRouter();
  const hangouts = useApp((s) => s.hangouts);
  const places = useApp((s) => s.places);
  const [tab, setTab] = useState<Tab>('upcoming');
  const now = Date.now();

  const lists = useMemo(() => {
    const upcoming = hangouts.filter((h) => h.status !== 'archived' && h.at > now).sort((a, b) => a.at - b.at);
    const past = hangouts.filter((h) => h.status === 'live' || (h.status !== 'archived' && h.at <= now)).sort((a, b) => b.at - a.at);
    const archived = hangouts.filter((h) => h.status === 'archived').sort((a, b) => b.at - a.at);
    return { upcoming, past, archived };
  }, [hangouts, now]);

  const list = lists[tab];

  return (
    <Screen header={{ back: true, title: 'Hangouts' }} contentStyle={{ paddingHorizontal: space.screen }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.lg }}>
        {(['upcoming', 'past', 'archived'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radii.pill,
              backgroundColor: tab === t ? p.accent : p.surface,
              alignItems: 'center',
            }}
          >
            <Ty variant="bodySmall" color={tab === t ? p.onAccent : p.inkMuted} style={{ fontWeight: '700' }}>
              {t === 'upcoming' ? `Upcoming ${lists.upcoming.length}` : t === 'past' ? `Past ${lists.past.length}` : `Archived ${lists.archived.length}`}
            </Ty>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {list.map((h) => {
          const dest = h.destinationId ? places.find((pl) => pl.id === h.destinationId) : undefined;
          return (
            <Pressable
              key={h.id}
              onPress={() => router.push(`/hangout/${h.id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: p.surface, borderRadius: radii.card, borderWidth: 1, borderColor: p.line, padding: space.md }}>
                <View style={{ flex: 1 }}>
                  <Ty variant="bodyStrong" numberOfLines={1}>{h.title}</Ty>
                  <Ty variant="bodySmall" muted style={{ marginTop: 2 }}>
                    {fmtDay(h.at)} at {fmtTime(h.at)} · {h.participants.filter((pp) => pp.rsvp !== 'invited').length} going
                  </Ty>
                  {dest ? <Ty variant="caption" faint numberOfLines={1} style={{ marginTop: 2 }}>📍 {dest.name}</Ty> : null}
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {h.participants.slice(0, 3).map((pp) => (
                    <Avatar key={pp.userId} name={pp.user?.name ?? 'User'} color={pp.user?.color ?? '#F0522F'} initials={pp.user?.initials ?? 'U'} size={26} />
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
        {list.length === 0 ? (
          <Ty variant="bodySmall" muted center style={{ marginTop: space.xl }}>
            No {tab} hangouts yet.
          </Ty>
        ) : null}
      </View>
    </Screen>
  );
}