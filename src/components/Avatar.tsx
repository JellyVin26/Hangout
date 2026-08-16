import { Image, StyleSheet, View } from 'react-native';
import { radii } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import type { ArrivalStatus } from '@/data/types';
import { Ty } from './Text';

export const statusColor = (p: ReturnType<typeof usePalette>, s: ArrivalStatus): string => {
  switch (s) {
    case 'arrived':
      return p.success;
    case 'onway':
      return p.accent;
    case 'late':
      return p.warn;
    default:
      return p.idle;
  }
};

export const statusLabel: Record<ArrivalStatus, string> = {
  arrived: 'Arrived',
  onway: 'On the way',
  late: 'Running late',
  idle: 'Not started',
};

interface AvatarProps {
  name: string;
  color: string;
  initials?: string;
  size?: number;
  uri?: string;
  status?: ArrivalStatus;
  style?: object;
}

export function Avatar({ name, color, initials, size = 44, uri, status, style }: AvatarProps) {
  const p = usePalette();
  const ring = status ? statusColor(p, status) : undefined;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ring ? 2.5 : 0,
          borderColor: ring ?? undefined,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Ty
          variant="bodyStrong"
          color="#FFFFFF"
          style={{
            fontSize: Math.max(11, size * 0.36),
            letterSpacing: 0.2,
            lineHeight: Math.round(Math.max(11, size * 0.36) * 1.25),
            includeFontPadding: false,
            textAlign: 'center',
          }}
        >
          {initials ?? ''}
        </Ty>
      )}
    </View>
  );
}

interface AvatarStackProps {
  items: { name: string; color: string; initials?: string; status?: ArrivalStatus }[];
  size?: number;
  max?: number;
}

export function AvatarStack({ items, size = 34, max = 4 }: AvatarStackProps) {
  const p = usePalette();
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((it, i) => (
        <View
          key={i}
          style={{
            marginLeft: i === 0 ? 0 : -size * 0.3,
            borderRadius: size / 2 + 2,
            borderWidth: 2,
            borderColor: p.surface,
          }}
        >
          <Avatar name={it.name} color={it.color} initials={it.initials} size={size} status={it.status} />
        </View>
      ))}
      {rest > 0 ? (
        <View
          style={{
            marginLeft: -size * 0.3,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: p.surfaceAlt,
            borderWidth: 2,
            borderColor: p.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ty variant="caption" color={p.inkMuted}>
            +{rest}
          </Ty>
        </View>
      ) : null}
    </View>
  );
}

interface StatusPillProps {
  status: ArrivalStatus;
  compact?: boolean;
}

export function StatusPill({ status, compact }: StatusPillProps) {
  const p = usePalette();
  const color = statusColor(p, status);
  const bg =
    status === 'arrived'
      ? p.successSoft
      : status === 'onway'
        ? p.accentSoft
        : status === 'late'
          ? p.warnSoft
          : p.idleSoft;
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg },
        compact && { paddingHorizontal: 8, paddingVertical: 3 },
      ]}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Ty variant={compact ? 'caption' : 'bodySmall'} color={color} style={{ fontWeight: '700' }}>
        {statusLabel[status]}
      </Ty>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
});
