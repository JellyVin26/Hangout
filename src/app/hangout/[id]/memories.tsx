import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Download, Heart, Plus } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { userById } from '@/data/seed';
import { fmtFull, timeAgo } from '@/lib/format';
import { Screen, EmptyState } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function MemoriesScreen() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hangout = useApp((s) => s.hangouts.find((h) => h.id === id));
  const addPhoto = useApp((s) => s.addPhoto);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  if (!hangout) {
    return (
      <Screen header={{ back: true }}>
        <EmptyState icon={<Ph name="Images" size={30} weight="duotone" color={p.inkFaint} />} title="Not found" />
      </Screen>
    );
  }

  const add = () => {
    const uri = `https://picsum.photos/seed/memory-${Math.floor(Math.random() * 10000)}/800/600`;
    addPhoto(hangout.id, uri);
    toast('Photo added to the album', 'success');
  };

  const sorted = [...hangout.photos].sort((a, b) => b.at - a.at);

  return (
    <Screen
      header={{
        back: true,
        title: 'Memories',
        subtitle: hangout.title,
        right: (
          <Pressable onPress={add} hitSlop={8}>
            <Ph name="Plus" size={24} weight="bold" color={p.accent} />
          </Pressable>
        ),
      }}
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Camera size={30} weight="duotone" color={p.inkFaint} />}
          title="No memories yet"
          body="Add photos from the hangout so the group can relive it."
          action={
            <Button label="Add first photo" icon="Camera" onPress={add} />
          }
        />
      ) : (
        <View style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Ty variant="bodySmall" muted>
              {sorted.length} photo{sorted.length === 1 ? '' : 's'} · {hangout.participants.filter((pp) => pp.rsvp !== 'invited').length} people
            </Ty>
            <Ty variant="bodySmall" color={p.accent} style={{ fontWeight: '600' }} onPress={() => toast('Album downloaded')}>
              <Download size={15} weight="bold" color={p.accent} /> Download all
            </Ty>
          </View>

          {sorted.map((ph) => {
            const by = userById(ph.by);
            const isLiked = liked[ph.id];
            return (
              <View key={ph.id}>
                <Image
                  source={{ uri: ph.uri }}
                  style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radii.card, backgroundColor: p.surfaceAlt }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Ty variant="bodySmall" style={{ fontWeight: '600' }}>
                      {by.name}
                    </Ty>
                    <Ty variant="caption" faint>
                      {timeAgo(ph.at)} · {fmtFull(hangout.at)}
                    </Ty>
                  </View>
                  <Pressable
                    onPress={() => setLiked((l) => ({ ...l, [ph.id]: !isLiked }))}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6 }}
                  >
                    <Heart size={20} weight={isLiked ? 'fill' : 'regular'} color={isLiked ? p.danger : p.inkMuted} />
                    <Ty variant="bodySmall" color={isLiked ? p.danger : p.inkMuted}>
                      {ph.likes + (isLiked ? 1 : 0)}
                    </Ty>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
