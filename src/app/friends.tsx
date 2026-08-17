import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MagnifyingGlass, UserPlus } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { api } from '@/lib/api';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

type Tab = 'friends' | 'requests' | 'add';

interface SearchHit {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export default function FriendsScreen() {
  const p = usePalette();
  const router = useRouter();
  const friends = useApp((s) => s.friends);
  const requests = useApp((s) => s.friendRequests);
  const currentUser = useApp((s) => s.user);
  const refreshFriends = useApp((s) => s.refreshFriends);
  const sendFriendRequest = useApp((s) => s.sendFriendRequest);
  const respondFriendRequest = useApp((s) => s.respondFriendRequest);
  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  useEffect(() => {
    const q = query.trim();
    if (tab !== 'add' || q.length < 2) {
      setHits(null);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = (await api(`/users/search?q=${encodeURIComponent(q)}`)) as SearchHit[];
        setHits(res.filter((u) => u.id !== currentUser?.id));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, tab, currentUser?.id]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);
  const outgoingIds = useMemo(() => new Set(requests.outgoing.map((r) => r.user.id)), [requests.outgoing]);

  const action = async (fn: () => Promise<void>, key: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } catch {
      toast('Something went wrong', 'info');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen header={{ back: true, title: 'Friends' }} contentStyle={{ paddingHorizontal: space.screen }}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.lg }}>
        {(['friends', 'requests', 'add'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radii.pill,
              backgroundColor: tab === t ? p.accent : p.surface,
              alignItems: 'center',
            }}
          >
            <Ty variant="bodySmall" color={tab === t ? p.onAccent : p.inkMuted} style={{ fontWeight: '700' }}>
              {t === 'friends' ? `Friends ${friends.length}` : t === 'requests' ? `Requests ${requests.incoming.length}` : 'Add'}
            </Ty>
          </Pressable>
        ))}
      </View>

      {tab === 'add' ? (
        <>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: p.surface, borderRadius: radii.input, borderWidth: 1, borderColor: p.line,
              paddingHorizontal: space.md, height: 50, marginBottom: space.lg,
            }}
          >
            <MagnifyingGlass size={20} weight="bold" color={p.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or @username"
              placeholderTextColor={p.inkFaint}
              style={{ flex: 1, fontFamily: 'Sora_400Regular', fontSize: 15, color: p.ink }}
              autoFocus
            />
            {searching ? <ActivityIndicator size="small" color={p.accent} /> : null}
          </View>
          <View style={{ gap: 4 }}>
            {(hits ?? []).map((h) => {
              const isFriend = friendIds.has(h.id);
              const sent = outgoingIds.has(h.id);
              return (
                <View
                  key={h.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: space.md,
                    paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: p.line,
                  }}
                >
                  <Avatar name={h.displayName} color="#F0522F" initials={h.displayName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'} size={44} />
                  <View style={{ flex: 1 }}>
                    <Ty variant="bodyStrong">{h.displayName}</Ty>
                    <Ty variant="bodySmall" muted>@{h.username}</Ty>
                  </View>
                  {isFriend ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Check size={14} weight="bold" color={p.success} />
                      <Ty variant="caption" color={p.success} style={{ fontWeight: '700' }}>Friends</Ty>
                    </View>
                  ) : sent ? (
                    <Ty variant="caption" muted style={{ fontWeight: '700' }}>Request sent</Ty>
                  ) : (
                    <Button
                      label="Add"
                      size="sm"
                      icon="UserPlus"
                      disabled={busy !== null}
                      onPress={() => action(() => sendFriendRequest(h.id), h.id)}
                    />
                  )}
                </View>
              );
            })}
            {hits && hits.length === 0 && query.trim().length >= 2 ? (
              <Ty variant="bodySmall" muted center style={{ marginTop: space.xl }}>No users found</Ty>
            ) : null}
          </View>
        </>
      ) : null}

      {tab === 'friends' ? (
        <View style={{ gap: 4 }}>
          {friends.length === 0 ? (
            <Ty variant="bodySmall" muted center style={{ marginTop: space.xl, paddingHorizontal: 24 }}>
              No friends yet. Use Add to find people by username — you can invite anyone to a hangout even without being friends.
            </Ty>
          ) : null}
          {friends.map((f) => (
            <View
              key={f.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: space.md,
                paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: p.line,
              }}
            >
              <Avatar name={f.name} color={f.color} initials={f.initials} size={44} uri={f.avatarUrl ?? undefined} />
              <View style={{ flex: 1 }}>
                <Ty variant="bodyStrong">{f.name}</Ty>
                <Ty variant="bodySmall" muted>@{f.username}{f.bio ? ` · ${f.bio}` : ''}</Ty>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'requests' ? (
        <View style={{ gap: 4 }}>
          {requests.incoming.length === 0 && requests.outgoing.length === 0 ? (
            <Ty variant="bodySmall" muted center style={{ marginTop: space.xl, paddingHorizontal: 24 }}>
              No friend requests.
            </Ty>
          ) : null}
          {requests.incoming.map((r) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: space.md,
                paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: p.line,
              }}
            >
              <Avatar name={r.user.name} color={r.user.color} initials={r.user.initials} size={44} uri={r.user.avatarUrl ?? undefined} />
              <View style={{ flex: 1 }}>
                <Ty variant="bodyStrong">{r.user.name}</Ty>
                <Ty variant="bodySmall" muted>@{r.user.username} wants to connect</Ty>
              </View>
              <Button
                label="Accept"
                size="sm"
                icon="Check"
                disabled={busy !== null}
                onPress={() => action(() => respondFriendRequest(r.id, true), r.id)}
              />
              <Button
                label="Decline"
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onPress={() => action(() => respondFriendRequest(r.id, false), r.id)}
              />
            </View>
          ))}
          {requests.outgoing.length > 0 ? (
            <Ty variant="bodySmall" faint style={{ marginTop: space.lg, marginBottom: 4 }}>Sent</Ty>
          ) : null}
          {requests.outgoing.map((r) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: space.md,
                paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: p.line,
              }}
            >
              <Avatar name={r.user.name} color={r.user.color} initials={r.user.initials} size={44} />
              <View style={{ flex: 1 }}>
                <Ty variant="bodyStrong">{r.user.name}</Ty>
                <Ty variant="bodySmall" muted>@{r.user.username}</Ty>
              </View>
              <Ty variant="caption" muted style={{ fontWeight: '700' }}>Pending</Ty>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
