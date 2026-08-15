import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NavigationArrow, X, Eye, Clock, MapPin } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { etaLabel } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { LiveMap } from '@/components/LiveMap';
import { RealMap } from '@/components/RealMap';
import { Avatar, StatusPill } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import type { SharingMode } from '@/data/types';

export default function LiveScreen() {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useNow(5000);
  const { id } = useLocalSearchParams<{ id: string }>();
  const hangout = useApp((s) => s.hangouts.find((h) => h.id === id));
  const live = useApp((s) => s.live[id]);
  const startLive = useApp((s) => s.startLive);
    const setSharing = useApp((s) => s.setSharing);
    const refreshLiveBoard = useApp((s) => s.refreshLiveBoard);
    const places = useApp((s) => s.places);
  const friendsList = useApp((s) => s.friends);
    const currentUser = useApp((s) => s.user);
  const userById = (uid: string) => {
    if (currentUser?.id === uid) return currentUser;
    const friend = friendsList.find((u) => u.id === uid);
    if (friend) return friend;
    const hp = hangout?.participants.find((pp) => pp.userId === uid)?.user;
    if (hp) return { id: hp.id, name: hp.name, username: hp.username, initials: hp.initials, color: hp.color, interests: [], badgeIds: [], hangoutCount: 0, placeCount: 0, friendIds: [] };
    return { id: uid, name: 'User', username: 'user', color: '#F0522F', initials: 'U', interests: [], badgeIds: [], hangoutCount: 0, placeCount: 0, friendIds: [] };
  };
  const [promptVisible, setPromptVisible] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
      if (!live) startLive(id);
    }, [id, live, startLive]);

    useEffect(() => {
      if (!id) return;
      refreshLiveBoard(String(id));
      const t = setInterval(() => refreshLiveBoard(String(id)), 5000);
      return () => clearInterval(t);
    }, [id, refreshLiveBoard]);

  useEffect(() => {
    if (!id || live?.me.sharing !== 'live') return;
    let active = true;
    let sub: Location.LocationSubscription | null = null;

    const postFix = async (coords: { latitude: number; longitude: number }) => {
      try {
        const res = await api<{ arrived?: boolean }>(`/hangouts/${id}/live/location`, {
          method: 'POST',
          body: { lat: coords.latitude, lng: coords.longitude },
        });
        if (res.arrived && active) {
          setSharing(id, 'none');
          toast('You arrived! Location sharing stopped.', 'success');
        }
      } catch {
        // Keep local simulation alive when the network is spotty.
      }
    };

    const run = async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        if (active) {
          setSharing(id, 'none');
          setLocationError('Location permission is off. Enable it to share live progress.');
          toast('Location permission is off', 'info');
        }
        return;
      }

      try {
        setLocationError(null);
        await api(`/hangouts/${id}/live/start`, { method: 'POST', body: { mode: 'LIVE' } }).catch(() => undefined);
        const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) await postFix(fix.coords);
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 10000 },
          (loc) => { void postFix(loc.coords); }
        );
      } catch {
        if (active) {
          setSharing(id, 'none');
          setLocationError('Could not read your location. Try again outside or check Location Services.');
          toast('Could not read your location', 'info');
        }
      }
    };

    void run();
    return () => {
      active = false;
      sub?.remove();
      void api(`/hangouts/${id}/live/stop`, { method: 'POST' }).catch(() => undefined);
    };
  }, [id, live?.me.sharing, setSharing]);

  if (!hangout || !live) {
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ty>Loading live session</Ty>
      </View>
    );
  }

  const dest =
    live.destination ??
    (hangout.destinationId ? places.find((pl) => pl.id === hangout.destinationId) ?? null : null);
  const me = live.me;
  const travelers = Object.entries(live.travelers)
    .map(([uid, t]) => ({ user: userById(uid), t }))
    .sort((a, b) => {
      const order: Record<string, number> = { arrived: 0, onway: 1, late: 2, idle: 3 };
      return order[a.t.status] - order[b.t.status];
    });

  const arrivedCount = travelers.filter((x) => x.t.status === 'arrived').length;
  const onwayCount = travelers.filter((x) => x.t.status === 'onway' || x.t.status === 'late').length;

  const meTraveler = Object.values(live.travelers).find((t) => t.userId === currentUser?.id);
  const myDistance = meTraveler?.distanceKm;

  const choose = (mode: SharingMode) => {
    setSharing(id, mode);
    setPromptVisible(false);
    if (mode === 'live') {
      toast('Sharing live location. Stops when you arrive.', 'success');
    } else if (mode === 'eta') {
      void api(`/hangouts/${id}/live/start`, { method: 'POST', body: { mode: 'ETA_ONLY' } }).catch(() => undefined);
      toast('Sharing your ETA with the group', 'success');
    }
  };

  const onArrive = (userId: string) => {
    if (userId === 'me') {
      setSharing(id, 'none');
      toast('You arrived! Location sharing stopped.', 'success');
      return;
    }
    const u = userById(userId);
    toast(`${u.name.split(' ')[0]} arrived at ${dest.name}`, 'success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: p.bg }]}>
        <Pressable onPress={() => router.replace('/')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
          <X size={20} weight="bold" color={p.ink} />
          <Ty variant="caption" color={p.ink} style={{ fontWeight: '700' }}>Home</Ty>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ty variant="title3">Live arrival</Ty>
          <Ty variant="caption" faint>
            {hangout.title}
          </Ty>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Map */}
                <View style={{ paddingHorizontal: space.screen }}>
                  {dest && dest.lat != null && dest.lng != null ? (
                    <RealMap
                      destination={{ lat: dest.lat, lng: dest.lng, name: dest.name }}
                      height={320}
                      travelers={travelers
                        .filter(({ t }) => t.lat != null && t.lng != null)
                        .map(({ user, t }) => ({
                          id: user.id,
                          lat: t.lat ?? 0,
                          lng: t.lng ?? 0,
                          status: t.status,
                          name: user.name,
                          initials: user.initials,
                          color: user.color,
                          isMe: user.id === currentUser?.id,
                        }))}
                    />
                  ) : (
                    <LiveMap
                      session={live}
                      height={380}
                      showLegend
                      onArrive={onArrive}
                      onNavigate={() => toast('Opening Google Maps directions')}
                    />
                  )}
                </View>

        {/* Arrival summary */}
        <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.screen, marginTop: space.md }}>
          <SummaryCard
            label="Arrived"
            value={`${arrivedCount}`}
            color={p.success}
            icon={<Ph name="CheckCircle" size={18} weight="fill" color={p.success} />}
          />
          <SummaryCard
            label="On the way"
            value={`${onwayCount}`}
            color={p.accent}
            icon={<Ph name="Navigation" size={18} weight="fill" color={p.accent} />}
          />
          <SummaryCard
            label="To destination"
            value={myDistance != null ? `${myDistance.toFixed(1)}` : dest && dest.distanceKm != null ? dest.distanceKm.toFixed(1) : '—'}
            suffix="km"
            color={p.ink}
            icon={<Ph name="MapPin" size={18} weight="fill" color={p.ink} />}
          />
        </View>

        {/* Location error */}
        {locationError ? (
          <View style={{ paddingHorizontal: space.screen, marginTop: space.md }}>
            <View style={{ padding: space.md, borderRadius: radii.card, backgroundColor: p.warnSoft, borderColor: p.warn, borderWidth: 1 }}>
              <Ty variant="caption" color={p.warn} style={{ fontWeight: '600' }}>
                {locationError}
              </Ty>
            </View>
          </View>
        ) : null}

        {/* Ready to head out prompt */}
        {me.sharing === 'none' && promptVisible ? (
          <View style={{ paddingHorizontal: space.screen, marginTop: space.lg }}>
            <View style={[styles.prompt, { backgroundColor: p.surface, borderColor: p.line }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 4 }}>
                <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ph name="Navigation" size={18} weight="fill" color={p.accent} />
                </View>
                <Ty variant="title3">Ready to head out?</Ty>
              </View>
              <Ty variant="bodySmall" muted>
                Your friends can see your progress on the map. Sharing is event-only and stops automatically when you arrive.
              </Ty>
              <View style={{ gap: 8, marginTop: space.md }}>
                <Button label="Share live location" icon="Navigation" fullWidth onPress={() => choose('live')} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button label="Share ETA only" variant="outline" style={{ flex: 1 }} onPress={() => choose('eta')} />
                  <Button label="Not now" variant="ghost" style={{ flex: 1 }} onPress={() => setPromptVisible(false)} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md, justifyContent: 'center' }}>
                <Eye size={14} weight="duotone" color={p.inkFaint} />
                <Ty variant="caption" faint style={{ fontSize: 11 }}>
                  Only people in this hangout can see your location
                </Ty>
              </View>
            </View>
          </View>
        ) : null}

        {/* My status */}
        {me.sharing !== 'none' ? (
          <View style={{ paddingHorizontal: space.screen, marginTop: space.lg }}>
            <View style={[styles.myCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ph name="Navigation" size={22} weight="fill" color={p.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Ty variant="bodyStrong">
                    {me.sharing === 'live' ? 'Sharing live location' : 'Sharing ETA'}
                  </Ty>
                  <Ty variant="bodySmall" muted>
                    {me.sharing === 'live' ? 'Everyone can see you on the map' : `Arriving in about ${etaLabel(me.totalSec / 60)}`}
                  </Ty>
                </View>
                <StatusPill status="onway" compact />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
                <Button label="Stop sharing" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => choose('none')} />
              </View>
            </View>
          </View>
        ) : null}

        {/* Travelers list */}
        <View style={{ paddingHorizontal: space.screen, marginTop: space.lg }}>
          <Ty variant="title3" style={{ marginBottom: space.md }}>
            Who's coming
          </Ty>
          <View style={{ gap: 10 }}>
            {travelers.map(({ user, t }) => {
              const progress = t.status === 'arrived' ? 1 : Math.min(1, Math.max(0, (now - t.startedAt) / 1000 / t.totalSec));
              const remainingMin = Math.max(0, Math.ceil(((1 - progress) * t.totalSec) / 60));
              return (
                <View key={user.id} style={[styles.travelerRow, { backgroundColor: p.surface, borderColor: p.line }]}>
                  <Avatar name={user.name} color={user.color} initials={user.initials} size={40} status={t.status} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Ty variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {user.name}
                      </Ty>
                      <View style={{ marginLeft: 8 }}>
                        <StatusPill status={t.status} compact />
                      </View>
                    </View>
                    <View style={{ marginTop: 6 }}>
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: p.surfaceAlt, overflow: 'hidden' }}>
                        <View
                          style={{
                            height: '100%',
                            width: `${progress * 100}%`,
                            backgroundColor: t.status === 'arrived' ? p.success : t.status === 'late' ? p.warn : p.accent,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                      <Ty variant="caption" faint style={{ marginTop: 3, fontSize: 10 }}>
                        {t.status === 'arrived'
                          ? 'Arrived at ' + (dest?.name ?? 'destination')
                          : t.status === 'late'
                            ? `Running late · ${remainingMin} min to go`
                            : t.distanceKm != null
                              ? `${t.distanceKm.toFixed(1)} km · ${etaLabel(remainingMin)} to ${dest?.name ?? 'destination'}`
                              : `${etaLabel(remainingMin)} to ${dest?.name ?? 'destination'}`}
                      </Ty>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value, suffix, color, icon }: { label: string; value: string; suffix?: string; color: string; icon: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: p.surface, borderRadius: radii.card, borderWidth: StyleSheet.hairlineWidth, borderColor: p.line, padding: space.md, alignItems: 'center', gap: 4 }}>
      {icon}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Ty variant="title3" color={color}>
          {value}
        </Ty>
        {suffix ? (
          <Ty variant="caption" muted style={{ marginLeft: 2 }}>
            {suffix}
          </Ty>
        ) : null}
      </View>
      <Ty variant="caption" faint style={{ fontSize: 10 }}>
        {label}
      </Ty>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screen,
    paddingBottom: 10,
  },
  prompt: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: space.lg,
  },
  myCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: space.lg,
  },
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
  },
});
