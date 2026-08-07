import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { useApp, usePalette } from '@/store/useApp';
import { radii, space } from '@/theme/tokens';
import { Ph, type PhIconName } from '@/components/icons';
import { Ty } from '@/components/Text';
import { haptic } from '@/lib/haptics';

const TABS: { name: string; icon: PhIconName; label: string }[] = [
  { name: 'index', icon: 'House', label: 'Home' },
  { name: 'hangouts', icon: 'CalendarDots', label: 'Hangouts' },
  { name: 'activity', icon: 'Bell', label: 'Activity' },
  { name: 'profile', icon: 'User', label: 'Profile' },
];

interface TabBarState {
  index: number;
  routes: { key: string; name: string; params?: object }[];
}
interface TabBarNavigation {
  emit: (e: any) => any;
  navigate: (name: string, params?: object) => void;
}

function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: TabBarState;
  descriptors: Record<string, { options?: unknown }>;
  navigation: TabBarNavigation;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const unread = useApp((s) => s.notifications.some((n) => !n.read));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.barWrap, { bottom: insets.bottom + 12 }]}
    >
      <BlurView
        intensity={70}
        tint={p.mode === 'dark' ? 'dark' : 'light'}
        style={[styles.bar, { borderColor: p.line, backgroundColor: p.tabBar }]}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? p.accent : p.navInactive;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                haptic.light();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={({ pressed }) => [
                styles.tab,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <View>
                <Ph name={tab.icon} size={22} weight={focused ? 'fill' : 'duotone'} color={color} />
                {tab.name === 'activity' && unread ? (
                  <View style={[styles.dot, { backgroundColor: p.accent }]} />
                ) : null}
              </View>
              <Ty
                variant="caption"
                style={{ fontSize: 10, fontWeight: focused ? '700' : '500' }}
                color={color}
              >
                {tab.label}
              </Ty>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const user = useApp((s) => s.user);
  const p = usePalette();
  if (!user) return <Redirect href="/welcome" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="hangouts" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    height: 64,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    position: 'absolute',
    top: -3,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
