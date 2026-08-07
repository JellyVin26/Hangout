import { Text as RNText, type TextProps } from 'react-native';
import { fontFamily, type } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';

type Variant = keyof typeof type;

const variantFont: Record<Variant, string> = {
  display: fontFamily.extrabold,
  title1: fontFamily.bold,
  title2: fontFamily.bold,
  title3: fontFamily.semibold,
  body: fontFamily.regular,
  bodyStrong: fontFamily.semibold,
  bodySmall: fontFamily.regular,
  caption: fontFamily.medium,
  micro: fontFamily.bold,
  bigNumber: fontFamily.extrabold,
};

interface TyProps extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  muted?: boolean;
  faint?: boolean;
}

/** Typography primitive. One family (Sora), weight-driven hierarchy. */
export function Ty({
  variant = 'body',
  color,
  center,
  muted,
  faint,
  style,
  ...rest
}: TyProps) {
  const p = usePalette();
  const resolvedColor = color ?? (muted ? p.inkMuted : faint ? p.inkFaint : p.ink);
  return (
    <RNText
      style={[
        { ...type[variant], fontFamily: variantFont[variant], color: resolvedColor },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}
