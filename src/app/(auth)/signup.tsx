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

export default function SignUpScreen() {
  const p = usePalette();
  const router = useRouter();
  const signUp = useApp((s) => s.signUp);
  const loading = useApp((s) => s.loading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Tell us your name';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    setAuthError('');
    if (Object.keys(e).length === 0) {
      try {
        await signUp(name, email, password);
      } catch (err: any) {
        setAuthError(err?.message || 'Registration failed');
      }
    }
  };

  return (
    <Screen
      header={{ back: true }}
      keyboard
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ alignItems: 'center', marginTop: space.md, marginBottom: space.xxl }}>
          <BrandMark size={52} />
          <Ty variant="title1" style={{ marginTop: space.md }}>
            Create your account
          </Ty>
          <Ty variant="bodySmall" muted style={{ marginTop: 4 }}>
            Plans look better with friends in them.
          </Ty>
        </View>

        <Field label="Name" error={errors.name}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Mara Diaz"
            autoCapitalize="words"
            error={!!errors.name}
          />
        </Field>
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
        <Field label="Password" error={errors.password} hint="At least 6 characters">
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={!!errors.password}
          />
        </Field>

        <Button label="Create account" fullWidth size="lg" onPress={submit} style={{ marginTop: space.sm }} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: space.xl }}>
          <Ty variant="bodySmall" muted>
            Already have an account?
          </Ty>
          <Ty
            variant="bodySmall"
            color={p.accent}
            style={{ fontWeight: '700' }}
            onPress={() => router.push('/signin')}
            suppressHighlighting
          >
            Log in
          </Ty>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
