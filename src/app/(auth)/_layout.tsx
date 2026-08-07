import { Redirect, Stack } from 'expo-router';
import { useApp } from '@/store/useApp';

export default function AuthLayout() {
  const user = useApp((s) => s.user);
  if (user) return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signin" />
    </Stack>
  );
}
