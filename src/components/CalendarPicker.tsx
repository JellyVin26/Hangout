import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Calendar month grid date picker. Keeps the time-of-day from `at`. */
export function CalendarPicker({ at, onSelect }: { at: number; onSelect: (ts: number) => void }) {
  const p = usePalette();
  const d = new Date(at);
  const [view, setView] = useState({ y: d.getFullYear(), m: d.getMonth() });

  const monthStart = new Date(view.y, view.m, 1);
  const lead = monthStart.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSelected = (day: number) => {
    const cur = new Date(at);
    return cur.getFullYear() === view.y && cur.getMonth() === view.m && cur.getDate() === day;
  };
  const isPast = (day: number) => {
    const t = new Date(view.y, view.m, day).getTime();
    return t < todayTs;
  };

  const pick = (day: number) => {
    if (isPast(day)) return;
    const cur = new Date(at);
    onSelect(new Date(view.y, view.m, day, cur.getHours(), cur.getMinutes()).getTime());
  };

  const shift = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      const ny = v.y + Math.floor(m / 12);
      return { y: ny, m: ((m % 12) + 12) % 12 };
    });
  };

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={{ backgroundColor: p.surface, borderRadius: radii.card, borderWidth: 1, borderColor: p.line, padding: space.md }}>
      {/* Month nav */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
        <Pressable onPress={() => shift(-1)} hitSlop={8} style={{ padding: 6 }}>
          <Ph name="ArrowLeft" size={18} weight="bold" color={p.inkMuted} />
        </Pressable>
        <Ty variant="bodyStrong">{monthLabel}</Ty>
        <Pressable onPress={() => shift(1)} hitSlop={8} style={{ padding: 6 }}>
          <Ph name="ArrowRight" size={18} weight="bold" color={p.inkMuted} />
        </Pressable>
      </View>
      {/* Weekday header */}
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
            <Ty variant="caption" faint style={{ fontWeight: '700', fontSize: 11 }}>
              {w}
            </Ty>
          </View>
        ))}
      </View>
      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }} />;
          const past = isPast(day);
          const selected = isSelected(day);
          return (
            <View key={day} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Pressable
                disabled={past}
                onPress={() => pick(day)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? p.accent : 'transparent',
                  opacity: past ? 0.3 : 1,
                }}
              >
                <Ty
                  variant="bodySmall"
                  style={{ fontWeight: selected ? '700' : '500' }}
                  color={selected ? p.onAccent : past ? p.inkFaint : p.ink}
                >
                  {day}
                </Ty>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
