import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { haptic } from '@/lib/haptics';
import { Ty } from './Text';
import { IconButton } from './Button';

interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  header?: {
    title?: string;
    subtitle?: string;
    back?: boolean;
    backTo?: string;
    right?: ReactNode;
    transparent?: boolean;
  };
  footer?: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboard?: boolean;
}

/** Standard screen: safe area, optional header, scrollable content, optional footer. */
export function Screen({
  children,
  header,
  footer,
  style,
  contentStyle,
  keyboard,
  ...scrollProps
}: ScreenProps) {
  const p = usePalette();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.bg }, style]} edges={['top', 'bottom']}>
      {header ? (
        <View
          style={[
            styles.header,
            header.transparent
              ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent' }
              : { backgroundColor: p.bg },
          ]}
        >
          <View style={{ width: 44, alignItems: 'flex-start' }}>
            {header.back ? (
              <IconButton
                icon="ArrowLeft"
                onPress={() => (header.backTo ? router.replace(header.backTo as never) : router.back())}
                bg={header.transparent ? 'rgba(255,255,255,0.25)' : p.surfaceAlt}
                color={header.transparent ? '#FFFFFF' : p.ink}
              />
            ) : null}
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {header.title ? (
              <Ty variant="title3" numberOfLines={1}>
                {header.title}
              </Ty>
            ) : null}
            {header.subtitle ? (
              <Ty variant="caption" muted numberOfLines={1}>
                {header.subtitle}
              </Ty>
            ) : null}
          </View>
          <View style={{ width: 44, alignItems: 'flex-end' }}>{header.right ?? null}</View>
        </View>
      ) : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            paddingBottom: footer ? space.xxl + 80 : space.xxxl,
            paddingTop: header ? space.sm : space.md,
          },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: p.bg,
              borderTopColor: p.line,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** Section header: title left, optional action right. No eyebrows, no split-header. */
export function SectionHeader({
  title,
  action,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
}) {
  const p = usePalette();
  return (
    <View style={styles.sectionHeader}>
      <Ty variant="title3">{title}</Ty>
      {action ??
        (actionLabel ? (
          <Pressable
            onPress={() => {
              haptic.light();
              onAction?.();
            }}
          >
            <Ty variant="bodySmall" color={p.accent} style={{ fontWeight: '600' }}>
              {actionLabel}
            </Ty>
          </Pressable>
        ) : null)}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  last,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const p = usePalette();
  const content = (
    <>
      {icon ? <View style={{ marginRight: space.md }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Ty variant="bodyStrong" numberOfLines={1}>
          {title}
        </Ty>
        {subtitle ? (
          <Ty variant="bodySmall" muted numberOfLines={1}>
            {subtitle}
          </Ty>
        ) : null}
      </View>
      {right ?? null}
    </>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: p.line },
        last && { borderBottomWidth: 0 },
        { opacity: pressed && onPress ? 0.7 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xl }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          backgroundColor: p.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.lg,
        }}
      >
        {icon}
      </View>
      <Ty variant="title3" center>
        {title}
      </Ty>
      {body ? (
        <Ty variant="bodySmall" muted center style={{ marginTop: 6, maxWidth: 260 }}>
          {body}
        </Ty>
      ) : null}
      {action ? <View style={{ marginTop: space.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screen,
    paddingVertical: space.sm,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.screen,
    paddingTop: space.md,
    paddingBottom: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
