import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { haptic } from '@/lib/haptics';
import { Ph, type PhIconName, type PhWeight } from './icons';
import { Ty } from './Text';

type Variant = 'primary' | 'soft' | 'outline' | 'ghost' | 'dark' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: Variant;
  size?: Size;
  icon?: PhIconName;
  iconWeight?: PhWeight;
  label: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const heights: Record<Size, number> = { sm: 40, md: 50, lg: 56 };

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconWeight = 'bold',
  label,
  fullWidth,
  disabled,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const p = usePalette();

  const bg: Record<Variant, string> = {
    primary: p.accent,
    soft: p.accentSoft,
    outline: 'transparent',
    ghost: 'transparent',
    dark: p.ink,
    danger: p.danger,
  };
  const fg: Record<Variant, string> = {
    primary: p.onAccent,
    soft: p.accentDeep,
    outline: p.ink,
    ghost: p.inkMuted,
    dark: p.bg,
    danger: p.onAccent,
  };
  const border: Record<Variant, string | undefined> = {
    primary: undefined,
    soft: undefined,
    outline: p.line,
    ghost: undefined,
    dark: undefined,
    danger: undefined,
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={(e) => {
        haptic.light();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          height: heights[size],
          borderRadius: radii.pill,
          paddingHorizontal: size === 'sm' ? 16 : 22,
          backgroundColor: disabled ? p.surfaceAlt : bg[variant],
          borderWidth: border[variant] ? 1 : 0,
          borderColor: border[variant],
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        fullWidth && { width: '100%' },
        style,
      ]}
      {...rest}
    >
      {icon ? <Ph name={icon} size={size === 'sm' ? 18 : 20} weight={iconWeight} color={fg[variant]} /> : null}
      <Ty
        variant={size === 'sm' ? 'caption' : 'bodyStrong'}
        style={{ letterSpacing: 0.1 }}
        color={disabled ? p.inkFaint : fg[variant]}
      >
        {label}
      </Ty>
    </Pressable>
  );
}

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: PhIconName;
  iconWeight?: PhWeight;
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  iconWeight = 'bold',
  size = 22,
  color,
  bg,
  onPress,
  style,
  ...rest
}: IconButtonProps) {
  const p = usePalette();
  return (
    <Pressable
      onPress={(e) => {
        haptic.light();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          width: size + 20,
          height: size + 20,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg ?? 'transparent',
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
        style,
      ]}
      {...rest}
    >
      <Ph name={icon} size={size} weight={iconWeight} color={color ?? p.ink} />
    </Pressable>
  );
}

export const Fab = ({
  icon,
  label,
  onPress,
  style,
}: {
  icon: PhIconName;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const p = usePalette();
  return (
    <Pressable
      onPress={(e) => {
        haptic.medium();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          height: 56,
          borderRadius: radii.pill,
          paddingHorizontal: space.xl,
          backgroundColor: p.ink,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          shadowColor: p.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 20,
          elevation: 8,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      <Ph name={icon} size={22} weight="bold" color={p.bg} />
      <Ty variant="bodyStrong" color={p.bg}>
        {label}
      </Ty>
    </Pressable>
  );
};
