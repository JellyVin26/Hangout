import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Heart } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { Screen, EmptyState } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function MemoriesScreen() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hangout = useApp((s) => s.hangouts.find((h) => h.id === id));
  const memories = useApp((s) => s.memories[id] ?? []);
  const loadMemories = useApp((s) => s.loadMemories);
  const toggleLike = useApp((s) => s.toggleMemoryLike);
  const addMemory = useApp((s) => s.addMemory);
  const places = useApp((s) => s.places);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) void loadMemories(id).catch(() => undefined);
  }, [id]);

  if (!hangout) {
    return (
      <Screen header={{ back: true }}>
        <EmptyState icon={<Ph name="Images" size={30} weight="duotone" color={p.inkFaint} />} title="Not found" />
      </Screen>
    );
  }

  const dest = hangout.destinationId ? places.find((pl) => pl.id === hangout.destinationId) : undefined;
  const going = hangout.participants.filter((pp) => pp.rsvp !== 'invited');

  const uploadPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const base64 = asset.base64;
    if (!base64) return;
    setUploading(true);
    try {
      const upload = (await api('/uploads', { method: 'POST', body: { base64, mime: asset.mimeType ?? 'image/jpeg', kind: 'MEMORY' } })) as { url: string };
      await addMemory(id, upload.url);
      toast('Photo added', 'success');
    } catch {
      toast('Upload failed', 'info');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen
      header={{ back: true, title: 'Memories', subtitle: hangout.title }}
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      {/* Stats bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
        <Ty variant="bodySmall" muted>
          {dest?.name ?? 'No destination'} · {going.length} people · {memories.length} photos
        </Ty>
      </View>

      {/* Add photo */}
      <Button
        label={uploading ? 'Uploading...' : 'Add a photo'}
        icon="Camera"
        variant="soft"
        fullWidth
        disabled={uploading}
        onPress={uploadPhoto}
        style={{ marginBottom: space.xl }}
      />

      {memories.length === 0 ? (
        <EmptyState
          icon={<Ph name="Camera" size={30} weight="duotone" color={p.inkFaint} />}
          title="No memories yet"
          body="Share moments from the hangout. Photos added in chat are collected here too."
        />
      ) : (
        <View style={{ gap: space.lg }}>
          {memories.map((m) => (
            <View key={m.id}>
              <Pressable onPress={() => { /* could add fullscreen viewer */ }}>
                <Image
                  source={{ uri: m.url }}
                  style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radii.card, backgroundColor: p.surfaceAlt }}
                />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Avatar name={m.authorName ?? 'User'} color="#F0522F" initials={(m.authorName ?? 'U').split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('') || '?'} size={24} uri={m.authorAvatarUrl ?? undefined} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Ty variant="bodySmall" style={{ fontWeight: '600' }}>{m.authorName ?? 'Someone'}</Ty>
                  <Ty variant="caption" faint>{timeAgo(m.at)}</Ty>
                </View>
                <Pressable
                  onPress={() => toggleLike(id, m.id)}
                  hitSlop={8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6 }}
                >
                  <Heart size={20} weight={m.liked ? 'fill' : 'regular'} color={m.liked ? p.danger : p.inkMuted} />
                  <Ty variant="bodySmall" color={m.liked ? p.danger : p.inkMuted}>{m.likes}</Ty>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
