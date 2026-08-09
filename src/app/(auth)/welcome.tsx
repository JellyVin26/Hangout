import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppleLogo, GoogleLogo, EnvelopeSimple, MapPin, UsersThree, ChartLineUp } from 'phosphor-react-native';
import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { haptic } from '@/lib/haptics';

const FEATURES = [
  { icon: MapPin, title: 'Pick a place', body: 'Discover spots with ratings, photos and live hours.' },
  { icon: UsersThree, title: 'Vote together', body: 'No more "up to you". The group decides in one tap.' },
  { icon: ChartLineUp, title: 'See who is here', body: 'Live ETAs and arrival status. Never ask where everyone is.' },
];

export default function WelcomeScreen() {
  const p = usePalette();
  const router = useRouter();
  const signIn = useApp((s) => s.signIn);
  const [loading, setLoading] = useState(false);

  const demoLogin = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.screen, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* decorative blobs */}
        <View pointerEvents="none" style={{ position: 'absolute', top: -60, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: p.accentSoft, opacity: 0.8 }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 40, left: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: p.surfaceAlt }} />

        <View style={{ alignItems: 'center', paddingTop: space.xxxl }}>
          <BrandMark size={72} />
          <Ty variant="display" style={{ marginTop: space.lg, letterSpacing: -1 }}>
            Hangout
          </Ty>
          <Ty variant="body" muted center style={{ marginTop: space.sm, maxWidth: 260 }}>
            From "let's hang out" to "everyone's here" in one app.
          </Ty>
        </View>

        <View style={{ marginTop: space.xxxl, gap: space.lg }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: p.surface,
                  borderWidth: 1,
                  borderColor: p.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <f.icon size={24} weight="duotone" color={p.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Ty variant="bodyStrong">{f.title}</Ty>
                <Ty variant="bodySmall" muted style={{ marginTop: 2 }}>
                  {f.body}
                </Ty>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 48 }} />

        <View style={{ gap: space.md, marginTop: space.xl }}>
          <Button
            label={loading ? 'Connecting…' : 'Continue with Google'}
            icon="GoogleLogo"
            iconWeight="fill"
            variant="outline"
            size="lg"
            fullWidth
            onPress={demoLogin}
          />
          <Button
            label={loading ? 'Connecting…' : 'Continue with Apple'}
            icon="AppleLogo"
            iconWeight="fill"
            variant="dark"
            size="lg"
            fullWidth
            onPress={demoLogin}
          />
          <Pressable
            onPress={() => {
              haptic.light();
              router.push('/signup');
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56 }}>
              <EnvelopeSimple size={20} weight="bold" color={p.ink} />
              <Ty variant="bodyStrong" color={p.ink}>
                Continue with email
              </Ty>
            </View>
          </Pressable>
        </View>

        <Ty variant="caption" faint center style={{ marginTop: space.xl, maxWidth: 300, alignSelf: 'center' }}>
          By continuing you agree to the Terms of Service and Privacy Policy.
        </Ty>
      </ScrollView>
    </SafeAreaView>
  );
}
