import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { Ty } from './Text';

interface ToastData {
  id: number;
  message: string;
  kind?: 'success' | 'info';
}

let pushToast: (t: Omit<ToastData, 'id'>) => void = () => {};

export function toast(message: string, kind: ToastData['kind'] = 'info') {
  pushToast({ message, kind });
}

export function Toaster() {
  const p = usePalette();
  const [queue, setQueue] = useState<ToastData[]>([]);

  useEffect(() => {
    pushToast = (t) => {
      const id = Date.now() + Math.random();
      setQueue((q) => [...q.slice(-2), { ...t, id }]);
      setTimeout(() => setQueue((q) => q.filter((x) => x.id !== id)), 2600);
    };
    return () => {
      pushToast = () => {};
    };
  }, []);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {queue.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </View>
  );
}

function ToastCard({ toast: t }: { toast: ToastData }) {
  const p = usePalette();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 260,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: p.ink,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {t.kind === 'success' ? <CheckCircle size={18} weight="fill" color={p.success} /> : null}
        <Ty variant="bodySmall" color={p.bg} style={{ flexShrink: 1 }}>
          {t.message}
        </Ty>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  card: {
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
});
