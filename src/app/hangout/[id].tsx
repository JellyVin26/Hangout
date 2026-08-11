import { View, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatCircleDots, MapPin, CalendarBlank, Clock, Users, Images as ImagesIcon, Crown } from 'phosphor-react-native';
import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { countdown, fmtDay, fmtTime, fmtDuration, timeAgo } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { Screen, SectionHeader, EmptyState } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Avatar, AvatarStack, StatusPill } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function HangoutDetailScreen() {
  const p = usePalette();
  const router = useRouter();
  const now = useNow(30000);
  const { id } = useLocalSearchParams<{ id: string }>();
  const hangout = useApp((s) => s.hangouts.find((h) => h.id === id));
  const vote = useApp((s) => s.vote);
  const live = useApp((s) => s.live[id]);
  const startLive = useApp((s) => s.startLive);
  const places = useApp((s) => s.places);
  const friends = useApp((s) => s.friends);
  const currentUser = useApp((s) => s.user);

  if (!hangout) {
    return (
      <Screen header={{ back: true }}>
        <EmptyState
          icon={<Ph name="CalendarBlank" size={30} weight="duotone" color={p.inkFaint} />}
          title="Hangout not found"
          body="This hangout may have been removed."
        />
      </Screen>
    );
  }

  const userById = (uid: string) => {
    if (currentUser?.id === uid) return currentUser;
    return friends.find((u) => u.id === uid) ?? { id: uid, name: 'User', username: 'user', color: '#F0522F', initials: 'U', interests: [], badgeIds: [], hangoutCount: 0, placeCount: 0, friendIds: [] };
  };
  const dest = places.find((pl) => pl.id === hangout.destinationId);
  const host = userById(hangout.hostId);
  const going = hangout.participants.filter((pp) => pp.rsvp !== 'invited');
  const meId = currentUser?.id;
  const invitedMe = hangout.participants.find((pp) => pp.userId === meId);
  const myRsvp = invitedMe?.rsvp ?? 'invited';
  const isHost = meId ? hangout.hostId === meId : false;
  const isLive = hangout.status !== 'archived' && hangout.at - now < 45 * 60000 && hangout.at - now > -2 * 3600000;
  const sessionLive = !!live;
  const votesFor = (placeId: string) => (hangout.votes[placeId] ?? []).length;
  const maxVotes = Math.max(1, ...hangout.candidates.map(votesFor));
  const totalVotes = hangout.candidates.reduce((acc, c) => acc + votesFor(c), 0);
  const myVote = meId ? hangout.candidates.find((c) => (hangout.votes[c] ?? []).includes(meId)) : undefined;

  return (
    <Screen
      header={{ back: true, transparent: true }}
      contentStyle={{ paddingBottom: 140, paddingHorizontal: 0 }}
    >
      {/* Hero */}
      <View style={{ height: 230, backgroundColor: p.surfaceAlt }}>
        {dest ? (
          <Image source={{ uri: dest.photo }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ph name="MapPin" size={48} weight="duotone" color={p.accent} />
          </View>
        )}
        <View style={{ position: 'absolute', left: 16, bottom: 14, right: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{ backgroundColor: 'rgba(16,12,10,0.72)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                {hangout.status === 'archived' ? 'Archived' : hangout.at - now <= 0 ? 'Happening now' : countdown(hangout.at, now)}
              </Ty>
            </View>
            {hangout.status === 'voting' ? (
              <View style={{ backgroundColor: p.warn, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                  Voting open
                </Ty>
              </View>
            ) : null}
            {hangout.visibility === 'public' ? (
              <View style={{ backgroundColor: 'rgba(16,12,10,0.72)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                  Public
                </Ty>
              </View>
            ) : null}
          </View>
          <Ty variant="title1" color="#FFFFFF">
            {hangout.title}
          </Ty>
        </View>
      </View>

      <View style={{ paddingHorizontal: space.screen }}>
        {/* Meta */}
        <Card style={{ marginTop: -space.lg, zIndex: 2 }}>
          <View style={{ gap: 10 }}>
            <MetaRow icon="CalendarBlank" text={`${fmtDay(hangout.at)} at ${fmtTime(hangout.at)}`} />
            <MetaRow icon="Clock" text={`${fmtDuration(hangout.durationMin)}`} />
            <MetaRow icon="MapPin" text={dest ? `${dest.name}, ${dest.address}` : `${hangout.candidates.length} places to vote on`} />
            <MetaRow icon="Users" text={`${going.length} going${hangout.maxParticipants ? ` of ${hangout.maxParticipants}` : ''}`} />
          </View>
          {hangout.description ? (
            <Ty variant="bodySmall" muted style={{ marginTop: space.md }}>
              {hangout.description}
            </Ty>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.md, gap: space.sm }}>
            <Avatar name={host.name} color={host.color} initials={host.initials} size={26} />
            <Ty variant="bodySmall" muted>
              Hosted by <Ty variant="bodySmall" style={{ fontWeight: '700' }} color={p.ink}>{host.name.split(' ')[0]}</Ty>
            </Ty>
            {hangout.hostId === meId ? (
              <View style={{ backgroundColor: p.warnSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Crown size={11} weight="fill" color={p.warn} />
                <Ty variant="caption" color={p.warn} style={{ fontWeight: '700', fontSize: 10 }}>
                  You
                </Ty>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Voting */}
        {hangout.status === 'voting' ? (
          <View style={{ marginTop: space.xl }}>
            <SectionHeader title="Pick the place" actionLabel={`${totalVotes} votes`} />
            <View style={{ gap: space.md }}>
              {hangout.candidates.map((candId) => {
                const pl = places.find((item) => item.id === candId);
                if (!pl) return null;
                const votes = votesFor(candId);
                const isLeader = votes === maxVotes && maxVotes > 0;
                const voted = myVote === candId;
                return (
                  <Pressable
                    key={candId}
                    onPress={() => vote(hangout.id, candId)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <Card
                      style={{
                        flexDirection: 'row',
                        gap: space.md,
                        alignItems: 'center',
                        borderWidth: voted ? 2 : 1,
                        borderColor: voted ? p.accent : p.line,
                      }}
                    >
                      <Image
                        source={{ uri: pl.photo }}
                        style={{ width: 64, height: 64, borderRadius: radii.md, backgroundColor: p.surfaceAlt }}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ty variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                            {pl.name}
                          </Ty>
                          {isLeader ? (
                            <View style={{ backgroundColor: p.accentSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Ty variant="caption" color={p.accentDeep} style={{ fontWeight: '700', fontSize: 10 }}>
                                Leading
                              </Ty>
                            </View>
                          ) : null}
                        </View>
                        <Ty variant="bodySmall" muted numberOfLines={1}>
                          {pl.category} · {pl.rating.toFixed(1)} ★
                        </Ty>
                        <View style={{ marginTop: 6 }}>
                          <View style={{ height: 6, borderRadius: 3, backgroundColor: p.surfaceAlt, overflow: 'hidden' }}>
                            <View
                              style={{
                                height: '100%',
                                width: `${(votes / Math.max(totalVotes, 1)) * 100}%`,
                                backgroundColor: voted ? p.accent : p.line,
                                borderRadius: 3,
                              }}
                            />
                          </View>
                          <Ty variant="caption" faint style={{ marginTop: 4 }}>
                            {votes} vote{votes === 1 ? '' : 's'}
                            {voted ? ' · Your pick' : ''}
                          </Ty>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Arrival coordination */}
        {isLive && dest ? (
          <View style={{ marginTop: space.xl }}>
            <SectionHeader
              title="Arrival coordination"
              actionLabel={sessionLive ? 'Open live map' : undefined}
              onAction={() => router.push(`/hangout/${id}/live`)}
            />
            {sessionLive ? (
              <Card onPress={() => router.push(`/hangout/${id}/live`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ph name="Navigation" size={26} weight="fill" color={p.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Ty variant="bodyStrong">Live on the map</Ty>
                  <Ty variant="bodySmall" muted>
                    {going.filter((g) => g.status === 'arrived').length} arrived · {going.filter((g) => g.status === 'onway').length} on the way
                  </Ty>
                </View>
                <Ph name="ArrowUpRight" size={20} weight="bold" color={p.inkFaint} />
              </Card>
            ) : (
              <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
                <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.md }}>
                  <Ph name="Navigation" size={28} weight="fill" color={p.accent} />
                </View>
                <Ty variant="title3" center>
                  Ready to head out?
                </Ty>
                <Ty variant="bodySmall" muted center style={{ marginTop: 4, maxWidth: 240 }}>
                  Share your live location or ETA so everyone knows when you arrive.
                </Ty>
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
                  <Button
                    label="Share ETA"
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      startLive(hangout.id);
                      router.push(`/hangout/${id}/live`);
                    }}
                  />
                  <Button
                    label="Share location"
                    size="sm"
                    icon="Navigation"
                    onPress={() => {
                      startLive(hangout.id);
                      router.push(`/hangout/${id}/live`);
                    }}
                  />
                </View>
                <Ty variant="caption" faint style={{ marginTop: space.md }}>
                  Location sharing ends automatically when you arrive
                </Ty>
              </Card>
            )}
          </View>
        ) : null}

        {/* Participants */}
        <View style={{ marginTop: space.xl }}>
          <SectionHeader title="Who's in" actionLabel={`${going.length} going`} />
          <Card padded={false} style={{ paddingHorizontal: space.screen }}>
            {going.map((pp, i) => {
              const u = userById(pp.userId);
              const last = i === going.length - 1;
              return (
                <View
                  key={pp.userId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingVertical: 12,
                    borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
                    borderBottomColor: p.line,
                  }}
                >
                  <Avatar name={u.name} color={u.color} initials={u.initials} size={40} status={isLive ? pp.status : undefined} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ty variant="bodyStrong" numberOfLines={1}>
                        {u.name}
                      </Ty>
                      {pp.role === 'host' ? <Crown size={13} weight="fill" color={p.warn} /> : null}
                      {pp.userId === meId ? (
                        <View style={{ backgroundColor: p.accentSoft, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 }}>
                          <Ty variant="caption" color={p.accentDeep} style={{ fontWeight: '700', fontSize: 10 }}>
                            You
                          </Ty>
                        </View>
                      ) : null}
                    </View>
                    <Ty variant="bodySmall" muted>
                      {pp.rsvp === 'maybe' ? 'Maybe' : pp.rsvp === 'declined' ? 'Declined' : pp.rsvp === 'invited' ? 'Invited' : isLive ? 'Going' : 'Going'}
                    </Ty>
                  </View>
                  {isLive ? <StatusPill status={pp.status} compact /> : null}
                </View>
              );
            })}
          </Card>
        </View>

        {/* Plan snapshot */}
        <View style={{ marginTop: space.xl }}>
          <SectionHeader title="Plan snapshot" />
          <Card style={{ flexDirection: 'row', gap: space.sm }}>
            <MiniStat icon="ChatCircleDots" label="Messages" value={`${hangout.messages.length}`} />
            <MiniStat icon="MapPin" label="Places" value={`${hangout.candidates.length}`} />
            <MiniStat icon="Images" label="Photos" value={`${hangout.photos.length}`} />
          </Card>
        </View>

        {/* Memories */}
        {hangout.status === 'archived' ? (
          <View style={{ marginTop: space.xl }}>
            <SectionHeader title="Memories" actionLabel={`${hangout.photos.length} photos`} />
            {hangout.photos.length > 0 ? (
              <Card onPress={() => router.push(`/hangout/${id}/memories`)} padded={false} style={{ overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {hangout.photos.slice(0, 4).map((ph) => (
                    <Image key={ph.id} source={{ uri: ph.uri }} style={{ width: '25%', aspectRatio: 1, backgroundColor: p.surfaceAlt }} />
                  ))}
                </View>
              </Card>
            ) : (
              <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
                <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: space.md }}>
                  <ImagesIcon size={26} weight="duotone" color={p.accent} />
                </View>
                <Ty variant="title3" center>
                  No photos yet
                </Ty>
                <Ty variant="bodySmall" muted center style={{ marginTop: 4, maxWidth: 240 }}>
                  Photos shared in chat are collected here after the hangout.
                </Ty>
              </Card>
            )}
          </View>
        ) : null}
      </View>

      {/* Footer */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 0 }}>
        <View style={{ flexDirection: 'row', gap: space.sm, backgroundColor: p.bg, paddingTop: space.md, paddingBottom: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }}>
          {!isHost && myRsvp === 'invited' ? (
            <>
              <Button label="Decline" variant="outline" style={{ flex: 1 }} onPress={() => toast('Invite declined')} />
              <Button label="Join" icon="Check" style={{ flex: 2 }} onPress={() => toast('You are in!')} />
            </>
          ) : isLive && dest ? (
            <>
              <Button
                label="Live map"
                variant="outline"
                icon="Navigation"
                style={{ flex: 1 }}
                onPress={() => router.push(`/hangout/${id}/live`)}
              />
              <Button
                label="Open chat"
                icon="ChatCircleDots"
                style={{ flex: 2 }}
                onPress={() => router.push(`/hangout/${id}/chat`)}
              />
            </>
          ) : (
            <Button
              label="Open chat"
              icon="ChatCircleDots"
              fullWidth
              onPress={() => router.push(`/hangout/${id}/chat`)}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

function MetaRow({ icon, text }: { icon: any; text: string }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Ph name={icon} size={16} weight="duotone" color={p.accent} />
      <Ty variant="bodySmall" muted style={{ flex: 1 }}>
        {text}
      </Ty>
    </View>
  );
}

function MiniStat({ icon, label, value }: { icon: any; label: string; value: string }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ph name={icon} size={17} weight="duotone" color={p.accent} />
      </View>
      <Ty variant="bodyStrong">{value}</Ty>
      <Ty variant="caption" faint style={{ fontSize: 10 }}>{label}</Ty>
    </View>
  );
}