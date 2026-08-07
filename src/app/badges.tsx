import { View } from 'react-native';
import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Ty } from '@/components/Text';
import { Ph, type PhIconName } from '@/components/icons';

export default function BadgesScreen() {
  const p = usePalette();
  const badges = useApp((s) => s.badges);

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <Screen
      header={{ back: true, title: 'Badges' }}
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      <Ty variant="title3" style={{ marginBottom: space.md }}>
        Earned · {earned.length}
      </Ty>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.xl }}>
        {earned.map((b) => (
          <View key={b.id} style={{ alignItems: 'center', gap: 6, width: 96 }}>
            <View style={{ width: 68, height: 68, borderRadius: 24, backgroundColor: b.color, alignItems: 'center', justifyContent: 'center', shadowColor: b.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 }}>
              <Ph name={b.icon as PhIconName} size={32} weight="fill" color="#FFFFFF" />
            </View>
            <Ty variant="caption" style={{ fontWeight: '700', textAlign: 'center' }}>
              {b.name}
            </Ty>
            <Ty variant="caption" faint style={{ textAlign: 'center', fontSize: 10 }}>
              {b.blurb}
            </Ty>
          </View>
        ))}
      </View>

      <Ty variant="title3" style={{ marginBottom: space.md }}>
        In progress · {locked.length}
      </Ty>
      <View style={{ gap: space.md }}>
        {locked.map((b) => (
          <Card key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
              <Ph name={b.icon as PhIconName} size={26} weight="regular" color={p.inkFaint} />
            </View>
            <View style={{ flex: 1 }}>
              <Ty variant="bodyStrong">{b.name}</Ty>
              <Ty variant="bodySmall" muted>
                {b.blurb}
              </Ty>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: p.surfaceAlt, overflow: 'hidden', marginTop: 8 }}>
                <View style={{ height: '100%', width: `${b.progress * 100}%`, backgroundColor: b.color, borderRadius: 3 }} />
              </View>
              <Ty variant="caption" faint style={{ marginTop: 3 }}>
                {Math.round(b.progress * 100)}% there
              </Ty>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
