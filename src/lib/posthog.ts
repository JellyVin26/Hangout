import { PostHog } from 'posthog-react-native';
import Constants from 'expo-constants';
import { useApp } from '@/store/useApp';

let posthog: PostHog | null = null;

export function initPostHog() {
  if (posthog) return posthog;
  const apiKey = Constants.expoConfig?.extra?.posthogApiKey;
  const host = Constants.expoConfig?.extra?.posthogHost ?? 'https://eu.i.posthog.com';
  if (!apiKey) {
    console.warn('[PostHog] No API key in app config extra.posthogApiKey');
    return null;
  }
  posthog = new PostHog(apiKey, {
    host,
    flushAt: 20,
    flushInterval: 5000,
    preloadFeatureFlags: true,
  });
  return posthog;
}

export function identifyPostHog(userId: string, traits?: Record<string, any>) {
  if (!posthog) initPostHog();
  posthog?.identify(userId, traits);
}

export function capturePostHog(event: string, properties?: Record<string, any>) {
  if (!posthog) initPostHog();
  posthog?.capture(event, properties);
}

export function aliasPostHog(distinctId: string, alias: string) {
  if (!posthog) initPostHog();
  posthog?.alias(alias);
}

/** Hook to capture screen views automatically. Call once in _layout.tsx. */
export function usePostHogScreenTracking() {
  const user = useApp((s) => s.user);
  // Screen tracking is handled by the plugin below; this ensures user identity is set.
  if (user?.id) {
    identifyPostHog(user.id, { username: user.username, displayName: user.name });
  }
}

export { PostHog } from 'posthog-react-native';