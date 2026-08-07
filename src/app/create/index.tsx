import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarBlank, Clock, MapPin, Users } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { useDraft } from '@/store/useDraft';
import { PLACES } from '@/data/seed';
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

  const setTime = (hour: number, minute = 0) => {
    const d = new Date(draft.at);
    d.setHours(hour, minute, 0, 0);
    draft.set({ at: d.getTime() });
  };

  const setDay = (offset: number) => {
    setDayOffset(offset);
    draft.set({ at: atDayOffset(offset, new Date(draft.at).getHours(), new Date(draft.at).getMinutes()) });
  };

  const canContinue = draft.title.trim().length > 0 && draft.candidateIds.length > 0;

  return (
    <Screen
      header={{ back: true, title: 'New hangout' }}
      footer={
        <Button
          label="Continue"
          icon="ArrowRight"
          fullWidth
          size="lg"
          disabled={!canContinue}
          onPress={() => router.push('/create/invite')}
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
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Field label="Start time">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Input
                value={fmtTime(draft.at)}
                onFocus={() => setTime(new Date().getHours() + 1)}
                editable={false}
                style={{ flex: 1 }}
              />
            </View>
          </Field>
        </View>
        <View style={{ flex: 1 }}>
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
  const place = PLACES.find((pl) => pl.id === cid);
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
