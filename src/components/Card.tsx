import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Star, Wallet } from 'phosphor-react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { haptic } from '@/lib/haptics';
import type { Place } from '@/data/types';
import { Ty } from './Text';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevation?: boolean;
}

export function Card({ children, onPress, style, padded = true, elevation }: CardProps) {
  const p = usePalette();
  const inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: p.surface,
          borderRadius: radii.card,
          padding: padded ? space.lg : 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: p.line,
        },
        elevation && {
          shadowColor: p.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.07,
          shadowRadius: 16,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={(e) => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {inner}
    </Pressable>
  );
}

const priceLabel = (lvl: number) => '$'.repeat(lvl);

/** Compact place card used in rows and grids. */
export function PlaceCard({
  place,
  onPress,
  selected,
  compact,
}: {
  place: Place;
  onPress?: () => void;
  selected?: boolean;
  compact?: boolean;
}) {
  const p = usePalette();
  return (
    <Card
      onPress={onPress}
      padded={false}
      style={[
        { overflow: 'hidden', width: compact ? 164 : undefined },
        selected && { borderColor: p.accent, borderWidth: 2 },
      ]}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: place.photo }}
          style={{ width: '100%', height: compact ? 96 : 140, backgroundColor: p.surfaceAlt }}
        />
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'rgba(20,16,13,0.72)',
            borderRadius: radii.pill,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
            {place.category}
          </Ty>
        </View>
      </View>
      <View style={{ padding: space.md }}>
        <Ty variant="bodyStrong" numberOfLines={1}>
          {place.name}
        </Ty>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <Star size={13} weight="fill" color={p.warn} />
          <Ty variant="caption" color={p.ink} style={{ fontWeight: '600' }}>
            {place.rating.toFixed(1)}
          </Ty>
          <Ty variant="caption" faint>
            ({place.reviewCount})
          </Ty>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: p.inkFaint }} />
          <Wallet size={12} weight="fill" color={p.inkFaint} />
          <Ty variant="caption" faint>
            {priceLabel(place.priceLevel)}
          </Ty>
        </View>
        <Ty variant="caption" faint numberOfLines={1} style={{ marginTop: 3 }}>
          {place.distanceKm.toFixed(1)} km away
        </Ty>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
});
