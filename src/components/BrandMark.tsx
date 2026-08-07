import Svg, { Circle } from 'react-native-svg';
import { usePalette } from '@/store/useApp';

/**
 * Brand mark: two circles coming together (people meeting),
 * with a dot at the point where they meet.
 */
export function BrandMark({ size = 44 }: { size?: number }) {
  const p = usePalette();
  const r = size * 0.36;
  const c1x = size * 0.38;
  const c2x = size * 0.62;
  const cy = size * 0.5;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c1x} cy={cy} r={r} fill={p.accent} />
      <Circle cx={c2x} cy={cy} r={r} fill={p.ink} />
      <Circle cx={size * 0.5} cy={cy} r={size * 0.075} fill={p.bg} />
    </Svg>
  );
}
