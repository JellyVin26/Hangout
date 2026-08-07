import { Image, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, MapPin, Star, Wallet } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { PLACES, userById } from '@/data/seed';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function PlaceDetailScreen() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = PLACES.find((pl) => pl.id === id);

  if (!place) {
    return (
      <Screen header={{ back: true }}>
        <Ty center muted style={{ marginTop: space.xxl }}>
          Place not found
        </Ty>
      </Screen>
    );
  }

  const reviewers = ['u_priya', 'u_noah', 'u_aisha', 'u_lena'];
  const reviews = [
    { by: 'u_priya', text: 'The pour over here ruined other coffee for me. Window seats are prime.', rating: 5 },
    { by: 'u_noah', text: 'Great light at golden hour. The brick wall is a solid photo backdrop.', rating: 5 },
    { by: 'u_aisha', text: 'Busy on weekends, quiet on weekday mornings. Get the seasonal special.', rating: 4 },
  ];

  return (
    <Screen
      header={{ back: true, transparent: true }}
      contentStyle={{ paddingHorizontal: 0, paddingBottom: 140 }}
    >
      <Image source={{ uri: place.photo }} style={{ width: '100%', height: 240, backgroundColor: p.surfaceAlt }} />

      <View style={{ paddingHorizontal: space.screen }}>
        <View style={{ marginTop: -space.lg, backgroundColor: p.bg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingTop: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Ty variant="title1">{place.name}</Ty>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Star size={14} weight="fill" color={p.warn} />
                <Ty variant="bodyStrong" color={p.warn}>
                  {place.rating.toFixed(1)}
                </Ty>
                <Ty variant="bodySmall" faint>
                  ({place.reviewCount} reviews)
                </Ty>
                <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: p.inkFaint }} />
                <Wallet size={13} weight="fill" color={p.inkFaint} />
                <Ty variant="bodySmall" faint>
                  {'$'.repeat(place.priceLevel)}
                </Ty>
              </View>
            </View>
            <Button label="Plan here" icon="Plus" size="sm" onPress={() => toast('Opens the create flow')} />
          </View>

          <View style={{ gap: 8, marginTop: space.lg }}>
            <InfoRow icon="MapPin" text={place.address} />
            <InfoRow icon="Clock" text={place.hours} />
            <InfoRow icon="Navigation" text={`${place.distanceKm.toFixed(1)} km away · about 12 min by car`} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.lg }}>
            {place.tags.map((t) => (
              <View key={t} style={{ backgroundColor: p.accentSoft, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Ty variant="bodySmall" color={p.accentDeep} style={{ fontWeight: '600' }}>
                  {t}
                </Ty>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <View style={{ marginTop: space.xl }}>
            <Ty variant="title3" style={{ marginBottom: space.md }}>
              Reviews
            </Ty>
            <View style={{ gap: space.md }}>
              {reviews.map((r, i) => {
                const u = userById(r.by);
                return (
                  <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
                    <Avatar name={u.name} color={u.color} initials={u.initials} size={38} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ty variant="bodyStrong">{u.name}</Ty>
                        <View style={{ flexDirection: 'row', gap: 1 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={11} weight={s <= r.rating ? 'fill' : 'regular'} color={s <= r.rating ? p.warn : p.line} />
                          ))}
                        </View>
                      </View>
                      <Ty variant="bodySmall" muted style={{ marginTop: 3 }}>
                        {r.text}
                      </Ty>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Reviews by friends */}
          <View style={{ marginTop: space.xl, marginBottom: space.xl }}>
            <Ty variant="title3" style={{ marginBottom: space.md }}>
              Friends who went
            </Ty>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              {reviewers.map((rid) => {
                const u = userById(rid);
                return (
                  <View key={rid} style={{ alignItems: 'center', gap: 4 }}>
                    <Avatar name={u.name} color={u.color} initials={u.initials} size={44} />
                    <Ty variant="caption" style={{ fontSize: 10 }}>
                      {u.name.split(' ')[0]}
                    </Ty>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 0 }}>
        <View style={{ flexDirection: 'row', gap: space.sm, backgroundColor: p.bg, paddingTop: space.md, paddingBottom: space.lg, borderTopWidth: 1, borderTopColor: p.line }}>
          <Button label="Directions" variant="outline" icon="Navigation" style={{ flex: 1 }} onPress={() => toast('Opening Google Maps')} />
          <Button label="Plan a hangout here" icon="Plus" style={{ flex: 2 }} onPress={() => toast('Opens the create flow')} />
        </View>
      </View>
    </Screen>
  );
}

function InfoRow({ icon, text }: { icon: any; text: string }) {
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
