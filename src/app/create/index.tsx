import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { CalendarBlank, Clock, MapPin, Users } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette, useApp } from '@/store/useApp';
import { useDraft } from '@/store/useDraft';
import { CATEGORIES, type Category, type Visibility } from '@/data/types';
import { atDayOffset, fmtDay, fmtTime } from '@/lib/format';
import { Screen } from '@/components/Screen';
import { Field, Input, TextArea } from '@/components/Field';
import { ChipRow, Segmented } from '@/components/Chip';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';

const DAYS = [
  { label: 'Today', value: '0' },
  { label: 'Tomorrow', value: '1' },
  { label: 'Sat', value: '2' },
  { label: 'Sun', value: '3' },
];

export default function CreateHangoutScreen() {
  const p = usePalette();
  const router = useRouter();
  const draft = useDraft();
  const [dayOffset, setDayOffset] = useState(1);

  const setHour = (h12: number) => {
    const cur = new Date(draft.at);
    const ampm = cur.getHours() >= 12 ? 'PM' : 'AM';
    const h24 = ampm === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12;
    cur.setHours(h24, cur.getMinutes(), 0, 0);
    draft.set({ at: cur.getTime() });
  };
  const setMinute = (m: number) => {
    const cur = new Date(draft.at);
    cur.setMinutes(m, 0, 0);
    draft.set({ at: cur.getTime() });
  };
  const setAmPm = (ampm: 'AM' | 'PM') => {
    const cur = new Date(draft.at);
    const isPm = cur.getHours() >= 12;
    if ((ampm === 'PM' && !isPm) || (ampm === 'AM' && isPm)) {
      cur.setHours(cur.getHours() + (ampm === 'PM' ? 12 : -12));
    }
    draft.set({ at: cur.getTime() });
  };
  const setDay = (offset: number) => {
    setDayOffset(offset);
    draft.set({ at: atDayOffset(offset, new Date(draft.at).getHours(), new Date(draft.at).getMinutes()) });
  };

  const canContinue = draft.title.trim().length > 0 && (draft.candidateIds.length > 0 || true);

    const handleContinue = () => {
      if (draft.candidateIds.length === 0) {
        router.push('/create/place');
      } else {
        router.push('/create/invite');
      }
    };

    return (
      <Screen
        header={{ back: true, title: 'New hangout' }}
        footer={
          <Button
            label="Continue"
            icon="ArrowRight"
            fullWidth
            size="lg"
            disabled={!draft.title.trim()}
            onPress={handleContinue}
          />
        }
        contentStyle={{ paddingHorizontal: space.screen }}
      >
      {/* Details */}
      <Ty variant="title3" style={{ marginBottom: space.md }}>
        The basics
      </Ty>
      <Field label="Title" hint="What are we doing?">
        <Input value={draft.title} onChangeText={(t) => draft.set({ title: t })} placeholder="Coffee and catch up" />
      </Field>
      <Field label="Description">
        <TextArea value={draft.description} onChangeText={(t) => draft.set({ description: t })} placeholder="Bring your best story from the week" />
      </Field>

      {/* When */}
      <Ty variant="title3" style={{ marginBottom: space.md }}>
        When
      </Ty>
      <Field label="Day">
        <ChipRow options={DAYS} value={`${dayOffset}`} onChange={(v) => setDay(Number(v))} />
      </Field>
      <View style={{ gap: space.md }}>
              <Field label="Start time">
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: p.surface,
                    borderRadius: radii.input,
                    borderWidth: 1,
                    borderColor: p.line,
                    overflow: 'hidden',
                  }}
                >
                  <Picker
                    selectedValue={String(new Date(draft.at).getHours())}
                    onValueChange={(v) => setHour(Number(v))}
                    style={{ flex: 1, height: 132, color: p.ink }}
                    itemStyle={{ fontFamily: 'Sora_500Medium', fontSize: 18 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const h12 = i + 1;
                      return <Picker.Item key={h12} label={String(h12).padStart(2, '0')} value={String(h12 === 12 ? 0 : h12)} />;
                    })}
                  </Picker>
                  <View style={{ width: 1, height: 80, backgroundColor: p.line }} />
                  <Picker
                    selectedValue={String(new Date(draft.at).getMinutes())}
                    onValueChange={(v) => setMinute(Number(v))}
                    style={{ flex: 1, height: 132, color: p.ink }}
                    itemStyle={{ fontFamily: 'Sora_500Medium', fontSize: 18 }}
                  >
                    {Array.from({ length: 60 }, (_, m) => (
                      <Picker.Item key={m} label={String(m).padStart(2, '0')} value={String(m)} />
                    ))}
                  </Picker>
                  <View style={{ width: 1, height: 80, backgroundColor: p.line }} />
                  <Picker
                    selectedValue={new Date(draft.at).getHours() >= 12 ? 'PM' : 'AM'}
                    onValueChange={(v) => setAmPm(v as 'AM' | 'PM')}
                    style={{ flex: 1, height: 132, color: p.ink }}
                    itemStyle={{ fontFamily: 'Sora_500Medium', fontSize: 18 }}
                  >
                    <Picker.Item label="AM" value="AM" />
                    <Picker.Item label="PM" value="PM" />
                  </Picker>
                </View>
              </Field>
              <Field label="Duration">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <IconButton icon="Minus" size={16} bg={p.surfaceAlt} onPress={() => draft.set({ durationMin: Math.max(30, draft.durationMin - 30) })} />
                  <Ty variant="bodyStrong" style={{ width: 64, textAlign: 'center' }}>
                    {draft.durationMin >= 60 ? `${Math.floor(draft.durationMin / 60)}h ${draft.durationMin % 60 ? `${draft.durationMin % 60}m` : ''}` : `${draft.durationMin}m`}
                  </Ty>
                  <IconButton icon="Plus" size={16} bg={p.surfaceAlt} onPress={() => draft.set({ durationMin: draft.durationMin + 30 })} />
                </View>
              </Field>
            </View>

      {/* Category */}
      <Ty variant="title3" style={{ marginBottom: space.md }}>
        Category
      </Ty>
      <ChipRow
        options={CATEGORIES.map((c) => ({ label: c, value: c }))}
        value={draft.category}
        onChange={(v) => draft.set({ category: v as Category })}
      />

      {/* Visibility */}
      <View style={{ marginTop: space.lg }}>
        <Ty variant="title3" style={{ marginBottom: space.md }}>
          Who can see it
        </Ty>
        <Segmented
          value={draft.visibility}
          onChange={(v) => draft.set({ visibility: v as Visibility })}
          options={[
            { label: 'Private', value: 'private' },
            { label: 'Friends', value: 'friends' },
            { label: 'Public', value: 'public' },
          ]}
        />
      </View>

      {/* Destination */}
      <View style={{ marginTop: space.xl }}>
        <Ty variant="title3" style={{ marginBottom: space.md }}>
          Destination
        </Ty>
        {draft.candidateIds.length === 0 ? (
          <Card
            onPress={() => router.push('/create/place')}
            style={{ alignItems: 'center', paddingVertical: space.xl, borderStyle: 'dashed', borderWidth: 1.5, borderColor: p.line }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm }}>
              <Ph name="MapPin" size={24} weight="duotone" color={p.accent} />
            </View>
            <Ty variant="bodyStrong">Pick a place</Ty>
            <Ty variant="bodySmall" muted center style={{ marginTop: 2, maxWidth: 220 }}>
              Search Google Maps or browse nearby spots. Pick 1 or more to vote on.
            </Ty>
          </Card>
        ) : (
          <View style={{ gap: space.sm }}>
            {draft.candidateIds.map((cid) => (
              <PlacePickedRow key={cid} cid={cid} />
            ))}
            <Button label="Add another place" variant="soft" icon="Plus" onPress={() => router.push('/create/place')} />
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </Screen>
  );
}

function PlacePickedRow({ cid }: { cid: string }) {
  const p = usePalette();
  const draft = useDraft();
  const places = useApp((s) => s.places);
  const place = places.find((pl) => pl.id === cid);
  if (!place) return null;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <Ty variant="bodyStrong">{place.name}</Ty>
        <Ty variant="bodySmall" muted>
          {place.category} · {place.distanceKm.toFixed(1)} km
        </Ty>
      </View>
      <IconButton
        icon="X"
        size={16}
        bg={p.surfaceAlt}
        onPress={() => draft.set({ candidateIds: draft.candidateIds.filter((c) => c !== cid) })}
      />
    </Card>
  );
}
