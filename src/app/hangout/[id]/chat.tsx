import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, PaperPlaneTilt, Plus, Smiley, X } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { fmtTime, timeAgo } from '@/lib/format';
import { pickAndUploadImage } from '@/lib/upload';
import { api } from '@/lib/api';
import { Avatar } from '@/components/Avatar';
import { Ty } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Ph } from '@/components/icons';
import { haptic } from '@/lib/haptics';

export default function ChatScreen() {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hangout = useApp((s) => s.hangouts.find((h) => h.id === id));
  const sendMessage = useApp((s) => s.sendMessage);
  const sendCheckIn = useApp((s) => s.sendCheckIn);
  const refreshMessages = useApp((s) => s.refreshMessages);
  const friendsList = useApp((s) => s.friends);
  const currentUser = useApp((s) => s.user);
  const userById = (uid: string) => {
    if (currentUser?.id === uid) return currentUser;
    return friendsList.find((u) => u.id === uid) ?? { id: uid, name: 'User', username: 'user', color: '#F0522F', initials: 'U', interests: [], badgeIds: [], hangoutCount: 0, placeCount: 0, friendIds: [] };
  };
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, [hangout?.messages.length]);

    // Poll for new messages (real-time sync via REST — WS not available on serverless)
    useEffect(() => {
      if (!id) return;
      const t = setInterval(() => refreshMessages(String(id)), 5000);
      refreshMessages(String(id));
      return () => clearInterval(t);
    }, [id, refreshMessages]);

    if (!hangout) {
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ty>Chat unavailable</Ty>
      </View>
    );
  }

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(hangout.id, trimmed);
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const addPhoto = async () => {
    try {
      const picked = await pickAndUploadImage();
      if (!picked) return;
      await sendPhoto(picked.url);
    } catch (e: any) {
      toast(e?.message ?? 'Photo upload failed');
    }
  };

  const sendPhoto = async (url: string) => {
    const id = `local_${Date.now()}`;
    const at = Date.now();
    const authorId = currentUser?.id ?? 'u_me';
    useApp.setState((s) => ({
      hangouts: s.hangouts.map((h) =>
        h.id === hangout.id
          ? { ...h, messages: [...h.messages, { id, authorId, image: url, at, kind: 'image' }] }
          : h,
      ),
    }));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      await api(`/hangouts/${hangout.id}/messages`, {
        method: 'POST',
        body: { body: '', kind: 'IMAGE', mediaUrl: url },
      });
    } catch {
      // keep optimistic message; refreshMessages will reconcile
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: p.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: p.bg, paddingTop: insets.top }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, paddingVertical: 10 }}>
          <Pressable onPress={() => router.replace({ pathname: '/hangout/[id]', params: { id: String(id) } })} hitSlop={8} style={{ padding: 4 }}>
            <X size={22} weight="bold" color={p.ink} />
          </Pressable>
          <View style={{ marginLeft: space.md }}>
            <Ty variant="title3">{hangout.title}</Ty>
            <Ty variant="caption" faint>
              {hangout.participants.filter((pp) => pp.rsvp !== 'invited').length} in the chat
            </Ty>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingVertical: space.lg, gap: 10 }}
        keyboardShouldPersistTaps="handled"
      >
        {hangout.messages.map((m) => {
          if (m.kind === 'system') {
            return (
              <View key={m.id} style={{ alignItems: 'center', marginVertical: 6 }}>
                <View style={{ backgroundColor: p.surfaceAlt, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Ty variant="caption" muted style={{ fontSize: 11 }}>
                    {m.text}
                  </Ty>
                </View>
              </View>
            );
          }
          const author = userById(m.authorId);
          const mine = currentUser ? m.authorId === currentUser.id : m.authorId === 'u_me';
          return (
            <View
              key={m.id}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 8,
                justifyContent: mine ? 'flex-end' : 'flex-start',
              }}
            >
              {!mine ? (
                <Avatar name={author.name} color={author.color} initials={author.initials} size={30} />
              ) : null}
              <View style={{ maxWidth: '72%', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {m.image ? (
                  <Image
                    source={{ uri: m.image }}
                    style={{ width: 200, height: 150, borderRadius: radii.card, backgroundColor: p.surfaceAlt }}
                  />
                ) : (
                  <View
                    style={{
                      backgroundColor: mine ? p.accent : p.surface,
                      borderRadius: 18,
                      borderTopRightRadius: mine ? 6 : 18,
                      borderTopLeftRadius: mine ? 18 : 6,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderWidth: mine ? 0 : StyleSheet.hairlineWidth,
                      borderColor: p.line,
                    }}
                  >
                    <Ty variant="body" color={mine ? p.onAccent : p.ink}>
                      {m.text}
                    </Ty>
                  </View>
                )}
                <Ty variant="caption" faint style={{ marginTop: 3, fontSize: 10 }}>
                  {mine ? '' : `${author.name.split(' ')[0]} · `}
                  {timeAgo(m.at)}
                </Ty>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Composer */}
      <View style={[styles.composerWrap, { backgroundColor: p.bg, paddingBottom: insets.bottom + 8 }]}>
        {/* Quick check-ins */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <QuickCheckin icon="Navigation" label="On my way" onPress={() => sendCheckIn(hangout.id, 'on_way')} />
          <QuickCheckin icon="Clock" label="10m late" onPress={() => sendCheckIn(hangout.id, 'late')} />
          <QuickCheckin icon="MapPinArea" label="Arrived" onPress={() => sendCheckIn(hangout.id, 'arrived')} />
        </View>
        <View style={[styles.composer, { backgroundColor: p.surface, borderColor: p.line }]}>
          <Pressable onPress={addPhoto} hitSlop={6} style={{ padding: 6 }}>
            <Camera size={22} weight="duotone" color={p.inkMuted} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message the group"
            placeholderTextColor={p.inkFaint}
            style={{ flex: 1, color: p.ink, fontFamily: 'Sora_400Regular', fontSize: 15, maxHeight: 100 }}
            multiline
          />
          <Pressable onPress={send} disabled={!text.trim()} hitSlop={6} style={{ padding: 6 }}>
            <PaperPlaneTilt size={22} weight={text.trim() ? 'fill' : 'regular'} color={text.trim() ? p.accent : p.inkFaint} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  composerWrap: {
    paddingHorizontal: space.screen,
    paddingTop: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
});

function QuickCheckin({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: radii.pill,
        backgroundColor: p.accentSoft,
        borderWidth: 1,
        borderColor: p.accent,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ph name={icon} size={14} weight="fill" color={p.accent} />
      <Ty variant="caption" color={p.accentDeep} style={{ fontWeight: '700' }}>
        {label}
      </Ty>
    </Pressable>
  );
}
