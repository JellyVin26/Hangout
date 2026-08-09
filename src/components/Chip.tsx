import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { haptic } from '@/lib/haptics';
import { Ph, type PhIconName } from './icons';
import { Ty } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: PhIconName;
  color?: string;
}

export function Chip({ label, selected, onPress, icon, color }: ChipProps) {
  const p = usePalette();
  const accent = color ?? p.accent;
  return (
    <Pressable
      onPress={(e) => {
        haptic.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : p.surface,
          borderColor: selected ? accent : p.line,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      {icon ? <Ph name={icon} size={15} weight="bold" color={selected ? p.onAccent : p.inkMuted} /> : null}
      <Ty variant="bodySmall" style={{ fontWeight: selected ? '700' : '500' }} color={selected ? p.onAccent : p.inkMuted}>
        {label}
      </Ty>
    </Pressable>
  );
}

/** Horizontally scrollable chip row. */
export function ChipRow({
  options,
  value,
  onChange,
  color,
}: {
  options: { label: string; value: string; icon?: PhIconName }[];
  value: string;
  onChange: (v: string) => void;
  color?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      style={{ flexGrow: 0 }}
    >
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          icon={o.icon}
          selected={value === o.value}
          color={color}
          onPress={() => onChange(o.value)}
        />
      ))}
    </ScrollView>
  );
}

/** Pill segmented control. */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const p = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: p.surfaceAlt,
        borderRadius: radii.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              haptic.light();
              onChange(o.value);
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                height: 36,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? p.surface : 'transparent',
                opacity: pressed ? 0.8 : 1,
                ...(active
                  ? {
                      shadowColor: p.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                    }
                  : {}),
              },
            ]}
          >
            <Ty variant="bodySmall" style={{ fontWeight: active ? '700' : '500' }} color={active ? p.ink : p.inkMuted}>
              {o.label}
            </Ty>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
