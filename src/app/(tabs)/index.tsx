import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Timer } from 'phosphor-react-native';

import { space, radii } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { CATEGORIES, type User } from '@/data/types';
import { countdown, fmtDay, fmtTime } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { BrandMark } from '@/components/BrandMark';
import { Card, PlaceCard } from '@/components/Card';
import { ChipRow } from '@/components/Chip';
import { Screen, SectionHeader } from '@/components/Screen';
import { Avatar, AvatarStack } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph, type PhIconName } from '@/components/icons';

const FALLBACK_USER: User = {
  id: 'me',
  name: 'You',
  username: 'you',
  color: '#F0522F',
  initials: 'Y',
  interests: [],
  badgeIds: [],
  hangoutCount: 0,
  placeCount: 0,
  friendIds: [],
};

export default function HomeScreen() {
  const p = usePalette();
  const router = useRouter();
  const now = useNow(30000);
  const user = useApp((s) => s.user);
  const hangouts = useApp((s) => s.hangouts);
  const badges = useApp((s) => s.badges);
  const places = useApp((s) => s.places);
  const friends = useApp((s) => s.friends);
  const unread = useApp((s) => s.notifications.some((n) => !n.read));
  const [category, setCategory] = useState('All');

  const me = user ?? FALLBACK_USER;

  const userById = (id: string): User => {
    if (me.id === id) return me;
    return friends.find((f) => f.id === id) ?? FALLBACK_USER;
  };
  const placeById = (id?: string) => (id ? places.find((pl) => pl.id === id) : undefined);

  const upcoming = hangouts
    .filter((h) => h.status !== 'archived' && h.at > now - 30 * 60000)
    .sort((a, b) => a.at - b.at);
  const next = upcoming[0];
  const nextPlace = next ? placeById(next.destinationId) : undefined;

  const trending = places
    .filter((pl) => category === 'All' || pl.category === category)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen contentStyle={{ paddingBottom: 140 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, marginBottom: space.xl }}>
        <BrandMark size={30} />
        <Ty variant="title2" style={{ marginLeft: 10 }}>
          Hangout
        </Ty>
        <View style={{ flex: 1 }} />
        <View style={{ position: 'relative' }}>
          <IconButton
            icon="Bell"
            size={22}
            bg={p.surfaceAlt}
            onPress={() => router.push('/activity')}
          />
          {unread ? (
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: p.accent,
                borderWidth: 1.5,
                borderColor: p.bg,
              }}
            />
          ) : null}
        </View>
        <Avatar name={me.name} color={me.color} initials={me.initials} size={38} style={{ marginLeft: space.sm }} />
      </View>

      {/* Greeting */}
      <View style={{ paddingHorizontal: space.screen, marginBottom: space.lg }}>
        <Ty variant="title1">{greeting}, {me.name.split(' ')[0]}</Ty>
        <Ty variant="bodySmall" muted style={{ marginTop: 2 }}>
          {upcoming.length} hangout{upcoming.length === 1 ? '' : 's'} coming up
        </Ty>
      </View>

      {/* Up next hero */}
      {next ? (
        <View style={{ paddingHorizontal: space.screen, marginBottom: space.xxl }}>
          <Card padded={false} style={{ overflow: 'hidden' }} onPress={() => router.push(`/hangout/${next.id}`)}>
            {nextPlace ? (
              <View style={{ height: 190 }}>
                <Image source={{ uri: nextPlace.photo }} style={{ width: '100%', height: '100%', backgroundColor: p.surfaceAlt }} />
                <LinearGradient
                  colors={['transparent', 'rgba(16,12,10,0.82)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 }}
                />
              </View>
            ) : (
              <View style={{ height: 90, backgroundColor: p.accentSoft, justifyContent: 'flex-end' }} />
            )}
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <View style={{ backgroundColor: 'rgba(16,12,10,0.72)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Timer size={13} weight="fill" color="#FFFFFF" />
                <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                  {next.at - now <= 0 ? 'Starting now' : countdown(next.at, now)}
                </Ty>
              </View>
              {next.status === 'voting' ? (
                <View style={{ backgroundColor: 'rgba(16,12,10,0.72)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                    Voting
                  </Ty>
                </View>
              ) : null}
            </View>
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
              <Ty variant="title2" color="#FFFFFF">
                {next.title}
              </Ty>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Ph name="MapPin" size={13} weight="fill" color="rgba(255,255,255,0.85)" />
                <Ty variant="bodySmall" color="rgba(255,255,255,0.85)" style={{ flexShrink: 1 }}>
                  {nextPlace ? `${nextPlace.name} · ${fmtDay(next.at)} at ${fmtTime(next.at)}` : `${fmtDay(next.at)} at ${fmtTime(next.at)}`}
                </Ty>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between', gap: space.sm }}>
                              <View style={{ flex: 1 }}>
                                <AvatarStack
                                  size={30}
                                  items={next.participants
                                    .filter((p) => p.rsvp !== 'invited')
                                    .map((p) => {
                                      const u = userById(p.userId);
                                      return { name: u.name, color: u.color, initials: u.initials, status: p.status };
                                    })}
                                />
                              </View>
                              {next.locationSharing ? (
                                <Pressable
                                  onPress={() => router.push(`/hangout/${next.id}/live`)}
                                  hitSlop={8}
                                  style={{ backgroundColor: p.accent, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 }}
                                >
                                  <Ph name="Navigation" size={13} weight="bold" color="#FFFFFF" />
                                  <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                                    See live map
                                  </Ty>
                                </Pressable>
                              ) : null}
                            </View>
            </View>
          </Card>
        </View>
      ) : null}

      {/* Category filter */}
      <View style={{ paddingHorizontal: space.screen, marginBottom: space.xl }}>
        <ChipRow
          value={category}
          onChange={setCategory}
          options={[{ label: 'All', value: 'All' }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]}
        />
      </View>

      {/* Trending */}
      <View style={{ paddingHorizontal: space.screen, marginBottom: space.xl }}>
        <SectionHeader title="Trending near you" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: space.md }}
                >
                  {trending.map((pl) => (
                    <PlaceCard key={pl.id} place={pl} compact onPress={() => router.push(`/place/${pl.id}`)} />
                  ))}
                </ScrollView>
      </View>

      {/* Nearby hangouts */}
      {upcoming.length > 1 ? (
        <View style={{ paddingHorizontal: space.screen, marginBottom: space.xl }}>
          <SectionHeader title="Nearby hangouts" />
          <View style={{ gap: space.md }}>
            {upcoming.slice(1, 4).map((h) => {
              const pl = placeById(h.destinationId ?? h.candidates[0]);
              return (
                <Card key={h.id} onPress={() => router.push(`/hangout/${h.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  {pl ? (
                    <Image
                      source={{ uri: pl.photo }}
                      style={{ width: 56, height: 56, borderRadius: radii.md, backgroundColor: p.surfaceAlt }}
                    />
                  ) : (
                    <View style={{ width: 56, height: 56, borderRadius: radii.md, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ph name="MapPin" size={22} weight="fill" color={p.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ty variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {h.title}
                      </Ty>
                    </View>
                    <Ty variant="bodySmall" muted numberOfLines={1} style={{ marginTop: 2 }}>
                      {fmtDay(h.at)} at {fmtTime(h.at)} · {pl?.name ?? 'Place TBD'}
                    </Ty>
                    <View style={{ marginTop: 6 }}>
                      <AvatarStack
                        size={24}
                        items={h.participants.filter((pp) => pp.rsvp !== 'invited').map((pp) => {
                          const u = userById(pp.userId);
                          return { name: u.name, color: u.color, initials: u.initials };
                        })}
                      />
                    </View>
                  </View>
                  {h.status === 'voting' ? (
                    <View style={{ backgroundColor: p.warnSoft, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Ty variant="caption" color={p.warn} style={{ fontWeight: '700' }}>
                        Voting
                      </Ty>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Badges teaser */}
      <View style={{ paddingHorizontal: space.screen, marginBottom: space.xl }}>
        <SectionHeader
          title="Your badges"
          actionLabel="See all"
          onAction={() => router.push('/badges')}
        />
        <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {badges.map((b) => (
                    <View key={b.id} style={{ alignItems: 'center', gap: 6, width: 62 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 17,
                          backgroundColor: b.earned ? b.color : p.surfaceAlt,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: b.earned ? 1 : 0.55,
                        }}
                      >
                        <Ph name={b.icon as PhIconName} size={22} weight={b.earned ? 'fill' : 'regular'} color={b.earned ? '#FFFFFF' : p.inkFaint} />
                      </View>
                      <Ty variant="caption" color={b.earned ? p.ink : p.inkFaint} style={{ textAlign: 'center', fontSize: 10 }}>
                        {b.name}
                      </Ty>
                    </View>
                  ))}
                </ScrollView>
      </View>
    </Screen>
  );
}