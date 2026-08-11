import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// Android: need a channel for notifications to show
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let tokenRegistered = false;

/** Request permission + register the ExpoPushToken with the backend. Idempotent. */
export async function registerPushToken() {
  if (!Device.isDevice) return;
  if (tokenRegistered) return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Hangout',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api('/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
    tokenRegistered = true;
  } catch (e) {
    console.warn('push registration failed', e);
  }
}

export type PushHandler = (data: Record<string, string>) => void;

/** Handle taps / foreground notifications. Returns unsubscribe fn. */
export function onPushNotification(handler: PushHandler) {
  // Tapped from cold start
  Notifications.getLastNotificationResponseAsync().then((resp) => {
    const data = resp?.notification?.request?.content?.data;
    if (data) handler(data as Record<string, string>);
  });
  // Tapped while app open
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    handler(resp.notification.request.content.data as Record<string, string>);
  });
  return () => sub.remove();
}