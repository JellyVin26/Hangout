import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MagnifyingGlass } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { useDraft } from '@/store/useDraft';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

interface RemoteUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  _count?: { friends?: number };
}

export default function InviteScreen() {
  const p = usePalette();
  const router = useRouter();
  const draft = useDraft();
  const friends = useApp((s) => s.friends);
  const currentUser = useApp((s) => s.user);
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<RemoteUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemote(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = (await api(`/users/search?q=${encodeURIComponent(q)}`)) as RemoteUser[];
        setRemote(res.filter((u) => u.id !== currentUser?.id));
      } catch {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, currentUser?.id]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const locals = friends.filter(
      (f) => f.id !== currentUser?.id && (!q || f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q))
    );
    if (!remote) return locals;
    const remotes = remote
      .filter((r) => !locals.some((l) => l.id === r.id))
      .map((r) => ({
        id: r.id,
        name: r.displayName,
        username: r.username,
        initials: r.displayName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?',
        color: '#F0522F',
        bio: r.bio ?? undefined,
        interests: [] as string[],
        badgeIds: [] as string[],
        hangoutCount: 0,
        placeCount: 0,
        friendIds: [] as string[],
        remote: true,
      }));
    return [...locals, ...remotes];
  }, [friends, remote, query, currentUser?.id]);

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
              {visible.map((f) => {
                const selected = draft.inviteeIds.includes(f.id);
                const isRemote = (f as any).remote === true;
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
                          @{f.username}
                          {isRemote ? ' · not a friend yet' : ''}
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

      <Pressable
              onPress={() => toast('After creating, share the hangout from its page — friends open the link and join instantly.')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.xl }}
            >
              <Ph name="QrCode" size={16} weight="duotone" color={p.inkFaint} />
              <Ty variant="bodySmall" muted>
                Or share the invite link with your group
              </Ty>
            </Pressable>
    </Screen>
  );
}
