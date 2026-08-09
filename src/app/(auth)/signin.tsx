import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { Field, Input } from '@/components/Field';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';

export default function SignInScreen() {
  const p = usePalette();
  const router = useRouter();
  const signIn = useApp((s) => s.signIn);
  const loading = useApp((s) => s.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 1) e.password = 'Enter your password';
    setErrors(e);
    setAuthError('');
    if (Object.keys(e).length === 0) {
      try {
        await signIn(email, password);
      } catch (err: any) {
        setAuthError(err?.message || 'Login failed');
      }
    }
  };

  return (
    <Screen header={{ back: true }} keyboard contentStyle={{ paddingHorizontal: space.screen }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ alignItems: 'center', marginTop: space.md, marginBottom: space.xxl }}>
          <BrandMark size={52} />
          <Ty variant="title1" style={{ marginTop: space.md }}>
            Welcome back
          </Ty>
          <Ty variant="bodySmall" muted style={{ marginTop: 4 }}>
            Your crew missed you.
          </Ty>
        </View>

        <Field label="Email" error={errors.email}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            error={!!errors.email}
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={!!errors.password}
          />
        </Field>

        <Button label={loading ? 'Signing in…' : 'Log in'} fullWidth size="lg" onPress={submit} style={{ marginTop: space.sm }} />

        {!!authError && (
          <Ty variant="bodySmall" color="#E5484D" style={{ marginTop: space.sm, textAlign: 'center' }}>
            {authError}
          </Ty>
        )}

        <View style={{ marginTop: space.md, padding: space.sm, borderRadius: 12, backgroundColor: p.surfaceAlt }}>
          <Ty variant="bodySmall" muted center>
            Demo login: maya@hangout.app / password123
          </Ty>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: space.xl }}>
          <Ty variant="bodySmall" muted>
            New here?
          </Ty>
          <Ty
            variant="bodySmall"
            color={p.accent}
            style={{ fontWeight: '700' }}
            onPress={() => router.push('/signup')}
            suppressHighlighting
          >
            Create an account
          </Ty>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
