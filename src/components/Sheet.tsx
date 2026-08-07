import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { Ty } from './Text';
import { IconButton } from './Button';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: number | 'auto';
}

/** Bottom sheet. Slides up with spring, backdrop press closes. */
export function Sheet({ visible, onClose, title, children, height = 'auto' }: SheetProps) {
  const p = usePalette();
  const translateY = useRef(new Animated.Value(600)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 240 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: p.overlay, opacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: p.surface,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              transform: [{ translateY }],
              maxHeight: '88%',
              ...(height !== 'auto' ? { height } : {}),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: p.line }]} />
          </View>
          {title ? (
            <View style={styles.titleRow}>
              <Ty variant="title3">{title}</Ty>
              <IconButton icon="X" size={18} onPress={onClose} bg={p.surfaceAlt} />
            </View>
          ) : null}
          <View style={{ paddingHorizontal: space.screen, paddingBottom: 32 }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingTop: 8 },
  handleWrap: { alignItems: 'center', paddingBottom: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screen,
    paddingBottom: space.md,
  },
});
