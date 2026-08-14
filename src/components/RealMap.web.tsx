import { View, StyleSheet } from 'react-native';
import { MapPin } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { Ty } from './Text';

interface TravelerFix {
  id: string;
  lat: number;
  lng: number;
  status?: 'arrived' | 'onway' | 'late' | 'idle';
  name: string;
  initials: string;
  color: string;
  isMe?: boolean;
}

interface RealMapProps {
  destination: { lat: number; lng: number; name: string };
  travelers?: TravelerFix[];
  routeFor?: (id: string) => Array<{ latitude: number; longitude: number }> | undefined;
  meTrail?: Array<{ latitude: number; longitude: number }>;
  height?: number;
}

/** Web-export fallback: react-native-maps is native-only. */
export function RealMap({ destination, travelers = [], height }: RealMapProps) {
  const p = usePalette();
  const moving = travelers.filter((t) => t.status !== 'idle').length;
  return (
    <View style={[styles.wrap, { height: height ?? 380, backgroundColor: p.surfaceAlt, borderColor: p.line }]}>
      <View style={[styles.pin, { backgroundColor: p.accentSoft }]}>
        <MapPin size={26} weight="fill" color={p.accent} />
      </View>
      <Ty variant="bodyStrong" center>{destination.name}</Ty>
      <Ty variant="bodySmall" muted center style={{ marginTop: 4 }}>
        {moving} sharing live location
      </Ty>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    overflow: 'hidden',
  },
  pin: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
});
