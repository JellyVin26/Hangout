import { useState } from 'react';
import { Image, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, QrCode, ShieldCheck, SignOut, Moon, Sun, MapPin, CalendarCheck, Trophy } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { FRIENDS, userById } from '@/data/seed';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Screen, ListRow, SectionHeader } from '@/components/Screen';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

export default function ProfileScreen() {
  const p = usePalette();
  const router = useRouter();
  const user = useApp((s) => s.user)!;
  const badges = useApp((s) => s.badges);
  const signOut = useApp((s) => s.signOut);
  const { theme, toggleTheme } = useAppTheme();
  const [showQr, setShowQr] = useState(false);

  const friends = user.friendIds
    .map((id) => userById(id))
    .filter((u) => FRIENDS.some((f) => f.id === u.id));
  const earned = badges.filter((b) => b.earned);

  return (
    <Screen contentStyle={{ paddingHorizontal: space.screen, paddingBottom: 140 }}>
      {/* Profile card */}
      <Card style={{ alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.xl }}>
        <View style={{ position: 'relative' }}>
          <Avatar name={user.name} color={user.color} initials={user.initials} size={84} />
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
            <CheckMark />
          </View>
        </View>
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
        <SectionHeader title={`Friends (${friends.length})`} actionLabel="Add friends" onAction={() => {}} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg }}>
          {friends.map((f) => (
            <View key={f.id} style={{ alignItems: 'center', gap: 6, width: 64 }}>
              <Avatar name={f.name} color={f.color} initials={f.initials} size={52} />
              <Ty variant="caption" style={{ fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
                {f.name.split(' ')[0]}
              </Ty>
            </View>
          ))}
        </ScrollView>
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
            subtitle="Scan a QR code to add a friend"
            right={<Ph name="ArrowUpRight" size={18} weight="bold" color={p.inkFaint} />}
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

function CheckMark() {
  return <Check size={14} weight="bold" color="#FFFFFF" />;
}
function useAppTheme() {
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  return { theme, toggleTheme };
}
