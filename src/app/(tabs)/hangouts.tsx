import { useState } from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarBlank, MapPin, Plus, Timer, Images as ImagesIcon } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { countdown, fmtDay, fmtFull, fmtTime, timeAgo } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { Card } from '@/components/Card';
import { Segmented } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { AvatarStack } from '@/components/Avatar';
import { Fab } from '@/components/Button';
import { Ty } from '@/components/Text';

export default function HangoutsScreen() {
  const p = usePalette();
  const router = useRouter();
  const now = useNow(30000);
  const hangouts = useApp((s) => s.hangouts);
  const places = useApp((s) => s.places);
  const friendsList = useApp((s) => s.friends);
  const currentUser = useApp((s) => s.user);
  const userById = (uid: string) => friendsList.find((u) => u.id === uid) ?? currentUser!;
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcoming = hangouts
    .filter((h) => h.status !== 'archived')
    .sort((a, b) => a.at - b.at);
  const past = hangouts.filter((h) => h.status === 'archived').sort((a, b) => b.at - a.at);
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <Screen
      header={{ title: 'Hangouts', subtitle: `${upcoming.length} coming up` }}
      contentStyle={{ paddingHorizontal: space.screen, paddingBottom: 140 }}
    >
      <View style={{ marginBottom: space.xl }}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as 'upcoming' | 'past')}
          options={[
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Past', value: 'past' },
          ]}
        />
      </View>

      <View style={{ gap: space.md }}>
        {list.map((h) => {
          const pl = places.find((item) => item.id === (h.destinationId ?? h.candidates[0]));
          const going = h.participants.filter((pp) => pp.rsvp !== 'invited');
          const isToday = fmtDay(h.at) === 'Today';
          const archived = h.status === 'archived';
          return (
            <Card
              key={h.id}
              onPress={() => router.push(`/hangout/${h.id}`)}
              style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}
            >
              <View style={{ width: 64, alignItems: 'center' }}>
                {pl ? (
                  <Image
                    source={{ uri: pl.photo }}
                    style={{ width: 64, height: 64, borderRadius: radii.md, backgroundColor: p.surfaceAlt }}
                  />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: radii.md, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={24} weight="fill" color={p.accent} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ty variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {h.title}
                  </Ty>
                  {h.status === 'voting' ? (
                    <View style={{ backgroundColor: p.warnSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Ty variant="caption" color={p.warn} style={{ fontWeight: '700', fontSize: 10 }}>
                        Voting
                      </Ty>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <CalendarBlank size={13} weight="fill" color={p.inkFaint} />
                  <Ty variant="bodySmall" muted>
                    {archived ? fmtFull(h.at) : `${isToday ? 'Today' : fmtDay(h.at)}, ${fmtTime(h.at)}`}
                  </Ty>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} weight="fill" color={p.inkFaint} />
                  <Ty variant="bodySmall" muted numberOfLines={1}>
                    {pl?.name ?? `${h.candidates.length} places to vote on`}
                  </Ty>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <AvatarStack
                    size={24}
                    items={going.map((pp) => {
                      const u = userById(pp.userId);
                      return { name: u.name, color: u.color, initials: u.initials };
                    })}
                  />
                  {!archived && h.at - now > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Timer size={12} weight="fill" color={h.at - now < 3600000 ? p.accent : p.inkFaint} />
                      <Ty variant="caption" color={h.at - now < 3600000 ? p.accent : p.inkFaint} style={{ fontWeight: '700' }}>
                        {countdown(h.at, now)}
                      </Ty>
                    </View>
                  ) : null}
                  {archived ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <ImagesIcon size={13} weight="fill" color={p.inkFaint} />
                      <Ty variant="caption" faint>
                        {h.photos.length} photos · {timeAgo(h.at)}
                      </Ty>
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {tab === 'upcoming' ? (
        <Fab
          icon="Plus"
          label="New hangout"
          onPress={() => router.push('/create')}
          style={{ position: 'absolute', right: space.screen, bottom: 20 }}
        />
      ) : null}
    </Screen>
  );
}
