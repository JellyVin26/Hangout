import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Field, Input, TextArea } from '@/components/Field';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Pressable } from 'react-native';

export default function EditProfileScreen() {
  const p = usePalette();
  const router = useRouter();
  const user = useApp((s) => s.user)!;
  const updateMyProfile = useApp((s) => s.updateMyProfile);
  const updateMyAvatar = useApp((s) => s.updateMyAvatar);

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Name is required', 'info');
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({ displayName: trimmed, bio: bio.trim() || undefined });
      toast('Profile updated', 'success');
      router.back();
    } catch {
      toast('Could not update profile', 'info');
      setSaving(false);
    }
  };

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

  return (
    <Screen header={{ back: true, title: 'Edit profile' }} contentStyle={{ paddingHorizontal: space.screen }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ alignItems: 'center', marginBottom: space.xl }}>
          <Pressable onPress={pickAvatar} disabled={avatarBusy}>
            <Avatar name={user.name} color={user.color} initials={user.initials} size={84} uri={user.avatarUrl ?? undefined} />
            <View
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: 13,
                backgroundColor: p.accent, borderWidth: 3, borderColor: p.surface,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Camera size={13} weight="bold" color="#FFFFFF" />
            </View>
          </Pressable>
          <Ty variant="bodySmall" muted style={{ marginTop: 6 }}>Tap to change photo</Ty>
        </View>

        <Card>
          <Field label="Name">
            <Input value={name} onChangeText={setName} placeholder="Your name" />
          </Field>
          <View style={{ height: space.md }} />
          <Field label="Bio">
            <TextArea value={bio} onChangeText={setBio} placeholder="Tell people about yourself" maxLength={150} />
          </Field>
          <Ty variant="caption" faint style={{ marginTop: 4, textAlign: 'right' }}>{bio.length}/150</Ty>
        </Card>

        <View style={{ marginTop: space.xl, flexDirection: 'row', gap: space.sm }}>
          <Button label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => router.back()} />
          <Button
            label={saving ? 'Saving...' : 'Save'}
            style={{ flex: 2 }}
            disabled={saving || !name.trim()}
            onPress={save}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
