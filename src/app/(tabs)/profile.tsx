import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { QrCode, ShieldCheck, SignOut, Moon, Sun, MapPin, CalendarCheck, Trophy, Camera } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Screen, ListRow, SectionHeader } from '@/components/Screen';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function ProfileScreen() {
  const p = usePalette();
  const router = useRouter();
  const user = useApp((s) => s.user)!;
  const badges = useApp((s) => s.badges);
  const signOut = useApp((s) => s.signOut);
  const friendsList = useApp((s) => s.friends);
  const updateMyAvatar = useApp((s) => s.updateMyAvatar);
  const userById = (uid: string) => friendsList.find((u) => u.id === uid) ?? user;
  const { theme, toggleTheme } = useAppTheme();
  const [showQr, setShowQr] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const base64 = asset.base64;
    if (!base64) return;
    setAvatarBusy(true);
    try {
      await updateMyAvatar(base64, asset.mimeType ?? 'image/jpeg');
      toast('Avatar updated', 'success');
    } catch {
      toast('Upload failed', 'info');
    } finally {
      setAvatarBusy(false);
    }
  };

  const friends = user.friendIds
    .map((id) => userById(id))
    .filter((u) => friendsList.some((f) => f.id === u.id));
  const earned = badges.filter((b) => b.earned);

  return (
    <Screen contentStyle={{ paddingHorizontal: space.screen, paddingBottom: 140 }}>
      {/* Profile card */}
      <Card style={{ alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.xl }}>
        <Pressable onPress={pickAvatar} style={{ position: 'relative' }} disabled={avatarBusy}>
          <Avatar name={user.name} color={user.color} initials={user.initials} size={84} uri={user.avatarUrl ?? undefined} />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: p.success,
              borderWidth: 3,
              borderColor: p.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Camera size={13} weight="bold" color="#FFFFFF" />}
          </View>
        </Pressable>
        <Ty variant="title2" style={{ marginTop: space.md }}>
          {user.name}
        </Ty>
        <Ty variant="bodySmall" muted>
          @{user.username}
        </Ty>
        <Ty variant="bodySmall" muted center style={{ marginTop: space.sm, maxWidth: 240 }}>
          {user.bio}
        </Ty>

        <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.xl }}>
          <Stat label="Hangouts" value={`${user.hangoutCount}`} icon="CalendarCheck" onPress={() => router.push('/hangouts')} />
          <Stat label="Places" value={`${user.placeCount}`} icon="MapPin" />
          <Stat label="Badges" value={`${earned.length}`} icon="Trophy" onPress={() => router.push('/badges')} />
        </View>
      </Card>

      {/* Interests */}
      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Interests" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {user.interests.map((i) => (
            <View key={i} style={{ backgroundColor: p.accentSoft, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ty variant="bodySmall" color={p.accentDeep} style={{ fontWeight: '600' }}>
                {i}
              </Ty>
            </View>
          ))}
        </View>
      </View>

      {/* Friends */}
      <View style={{ marginTop: space.xl }}>
        <SectionHeader title={`Friends (${friends.length})`} actionLabel="Add friends" onAction={() => router.push('/friends')} />
        {friends.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg }}>
            {friends.map((f) => (
              <View key={f.id} style={{ alignItems: 'center', gap: 6, width: 64 }}>
                <Avatar name={f.name} color={f.color} initials={f.initials} size={52} uri={f.avatarUrl ?? undefined} />
                <Ty variant="caption" style={{ fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
                  {f.name.split(' ')[0]}
                </Ty>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Card onPress={() => router.push('/friends')} style={{ alignItems: 'center', paddingVertical: space.xl, borderStyle: 'dashed', borderWidth: 1.5, borderColor: p.line }}>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm }}>
              <Ph name="UserPlus" size={24} weight="duotone" color={p.accent} />
            </View>
            <Ty variant="bodyStrong">Add friends</Ty>
            <Ty variant="bodySmall" muted center style={{ marginTop: 2, maxWidth: 230 }}>
              Find people by username or scan a code. Friends see each other's plans first.
            </Ty>
          </Card>
        )}
      </View>

      {/* Settings */}
      <View style={{ marginTop: space.xl }}>
        <Card padded={false} style={{ paddingHorizontal: space.screen }}>
          <ListRow
            icon={<Ph name={theme === 'dark' ? 'Moon' : 'Sun'} size={20} weight="duotone" color={p.accent} />}
            title="Appearance"
            subtitle={theme === 'dark' ? 'Dark mode' : 'Light mode'}
            right={
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: p.track, true: p.accent }}
                thumbColor={p.thumb}
              />
            }
          />
          <ListRow
            icon={<Ph name="QrCode" size={20} weight="duotone" color={p.accent} />}
            title="Add friends"
            subtitle="Search by username or scan a QR code"
            right={<Ph name="ArrowUpRight" size={18} weight="bold" color={p.inkFaint} />}
            onPress={() => router.push('/friends')}
          />
          <ListRow
            icon={<Ph name="ShieldCheck" size={20} weight="duotone" color={p.accent} />}
            title="Privacy & safety"
            subtitle="Location, blocking and reporting"
            right={<Ph name="ArrowUpRight" size={18} weight="bold" color={p.inkFaint} />}
          />
          <ListRow
            last
            icon={<Ph name="SignOut" size={20} weight="duotone" color={p.danger} />}
            title="Log out"
            subtitle="Sign out of Hangout"
            right={<Ph name="ArrowUpRight" size={18} weight="bold" color={p.inkFaint} />}
            onPress={signOut}
          />
        </Card>
      </View>

      <Ty variant="caption" faint center style={{ marginTop: space.xl }}>
        Hangout 1.0.0
      </Ty>
    </Screen>
  );
}

function Stat({ label, value, icon, onPress }: { label: string; value: string; icon: any; onPress?: () => void }) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Ph name={icon} size={20} weight="duotone" color={p.accent} />
      <Ty variant="title3">{value}</Ty>
      <Ty variant="caption" faint>
        {label}
      </Ty>
      {onPress ? (
        <Ph name="ArrowUpRight" size={14} weight="bold" color={p.inkFaint} />
      ) : null}
    </View>
  );
}

function useAppTheme() {
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  return { theme, toggleTheme };
}
