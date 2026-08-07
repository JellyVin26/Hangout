import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MagnifyingGlass } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { useDraft } from '@/store/useDraft';
import { FRIENDS } from '@/data/seed';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

export default function InviteScreen() {
  const p = usePalette();
  const router = useRouter();
  const draft = useDraft();
  const [query, setQuery] = useState('');

  const filtered = FRIENDS.filter((f) => {
    const q = query.trim().toLowerCase();
    return !q || f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q);
  });

  const toggle = (uid: string) => {
    const has = draft.inviteeIds.includes(uid);
    draft.set({
      inviteeIds: has ? draft.inviteeIds.filter((u) => u !== uid) : [...draft.inviteeIds, uid],
    });
  };

  return (
    <Screen
      header={{ back: true, title: 'Invite friends' }}
      footer={
        <Button
          label={draft.inviteeIds.length > 0 ? `Invite ${draft.inviteeIds.length} friend${draft.inviteeIds.length === 1 ? '' : 's'}` : 'Skip for now'}
          icon="ArrowRight"
          fullWidth
          size="lg"
          onPress={() => router.push('/create/review')}
        />
      }
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: p.surface,
          borderRadius: radii.input,
          borderWidth: 1,
          borderColor: p.line,
          paddingHorizontal: space.md,
          height: 50,
          marginBottom: space.lg,
        }}
      >
        <MagnifyingGlass size={20} weight="bold" color={p.inkFaint} />
        <Ty variant="body" style={{ flex: 1 }} color={query ? p.ink : p.inkFaint}>
          {query || 'Search friends'}
        </Ty>
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ph name="X" size={18} weight="bold" color={p.inkFaint} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: 4 }}>
        {filtered.map((f) => {
          const selected = draft.inviteeIds.includes(f.id);
          return (
            <Pressable key={f.id} onPress={() => toggle(f.id)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  paddingVertical: space.md,
                  borderBottomWidth: 1,
                  borderBottomColor: p.line,
                }}
              >
                <Avatar name={f.name} color={f.color} initials={f.initials} size={46} />
                <View style={{ flex: 1 }}>
                  <Ty variant="bodyStrong">{f.name}</Ty>
                  <Ty variant="bodySmall" muted>
                    @{f.username} · {f.interests.slice(0, 2).join(', ')}
                  </Ty>
                </View>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: selected ? p.accent : p.line,
                    backgroundColor: selected ? p.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected ? <Check size={15} weight="bold" color="#FFFFFF" /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.xl }}>
        <Ph name="QrCode" size={16} weight="duotone" color={p.inkFaint} />
        <Ty variant="bodySmall" muted>
          Or share the invite link with your group
        </Ty>
      </View>
    </Screen>
  );
}
