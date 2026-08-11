import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useApp } from '@/store/useApp';
import { Toaster } from '@/components/Toast';
import { registerPushToken, onPushNotification } from '@/lib/push';
import { useRouter } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useApp((s) => s.theme);
  const user = useApp((s) => s.user);
  const bootstrap = useApp((s) => s.bootstrap);
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // If user is persisted (logged in), refresh data from API on app start
  useEffect(() => {
    if (fontsLoaded && user) {
      bootstrap().catch(() => {/* token may be expired; user will be prompted on next action */});
      registerPushToken();
    }
  }, [fontsLoaded, user?.id]);

  // Push taps → deep link to the hangout
  useEffect(() => {
    if (!user) return;
    return onPushNotification((data) => {
      if (data.hangoutId) router.push(`/hangout/${data.hangoutId}` as never);
    });
  }, [user?.id]);

  if (!fontsLoaded) return null;

  const isDark = theme === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: '#F0522F',
      background: isDark ? '#16120F' : '#FAF7F3',
      card: isDark ? '#211C18' : '#FFFFFF',
      text: isDark ? '#F5F0EB' : '#211B17',
      border: isDark ? '#352D27' : '#EAE3DC',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: isDark ? '#16120F' : '#FAF7F3' },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="hangout/[id]" />
          <Stack.Screen name="hangout/[id]/chat" />
          <Stack.Screen name="hangout/[id]/live" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="hangout/[id]/memories" />
          <Stack.Screen name="create/index" options={{ presentation: 'modal' }} />
          <Stack.Screen name="create/place" options={{ presentation: 'modal' }} />
          <Stack.Screen name="create/invite" options={{ presentation: 'modal' }} />
          <Stack.Screen name="create/review" options={{ presentation: 'modal' }} />
          <Stack.Screen name="place/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="badges" options={{ presentation: 'modal' }} />
        </Stack>
        <Toaster />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
