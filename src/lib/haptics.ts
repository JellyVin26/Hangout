import * as Haptics from 'expo-haptics';

/** Haptic feedback helpers. No-ops on web and when unsupported. */
export const haptic = {
  light: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* no-op */
    }
  },
  medium: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* no-op */
    }
  },
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      /* no-op */
    }
  },
  warning: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      /* no-op */
    }
  },
};
