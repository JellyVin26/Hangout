import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarBlank, Clock, MapPin, Users } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { useDraft } from '@/store/useDraft';
import { useApp } from '@/store/useApp';
import { PLACES, userById } from '@/data/seed';
import { fmtDay, fmtTime, fmtDuration } from '@/lib/format';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AvatarStack } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function ReviewScreen() {
  const p = usePalette();
  const router = useRouter();
  const draft = useDraft();
  const createHangout = useApp((s) => s.createHangout);
  const candidates = draft.candidateIds.map((cid) => PLACES.find((pl) => pl.id === cid)!).filter(Boolean);
  const invitees = draft.inviteeIds.map((id) => userById(id));

  const create = () => {
    const id = createHangout({
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      at: draft.at,
      durationMin: draft.durationMin,
      category: draft.category,
      visibility: draft.visibility,
      maxParticipants: draft.maxParticipants,
      candidates: draft.candidateIds,
      inviteeIds: draft.inviteeIds,
    });
    draft.reset();
    toast('Hangout created!', 'success');
    router.replace(`/hangout/${id}`);
  };

  return (
    <Screen
      header={{ back: true, title: 'Review' }}
      footer={<Button label="Create hangout" icon="Check" fullWidth size="lg" onPress={create} />}
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      {/* Summary card */}
      <Card style={{ gap: 10 }}>
        <Ty variant="title2">{draft.title}</Ty>
        {draft.description ? (
          <Ty variant="bodySmall" muted>
            {draft.description}
          </Ty>
        ) : null}
        <View style={{ height: 1, backgroundColor: p.line, marginVertical: 4 }} />
        <Row icon="CalendarBlank" text={`${fmtDay(draft.at)} at ${fmtTime(draft.at)}`} />
        <Row icon="Clock" text={fmtDuration(draft.durationMin)} />
        <Row icon="MapPin" text={candidates.length === 1 ? candidates[0].name : `${candidates.length} places, group votes`} />
        <Row
          icon="Users"
          text={
            draft.visibility === 'public'
              ? 'Public · anyone can join'
              : draft.visibility === 'friends'
                ? 'Friends only'
                : 'Private'
          }
        />
        <Row icon="ShieldCheck" text={draft.inviteeIds.length > 0 ? `${draft.inviteeIds.length} invited` : 'No invites yet'} />
      </Card>

      {/* Places */}
      <Ty variant="title3" style={{ marginTop: space.xl, marginBottom: space.md }}>
        {candidates.length > 1 ? 'Vote options' : 'Destination'}
      </Ty>
      <View style={{ gap: space.md }}>
        {candidates.map((pl, i) => (
          <Card key={pl.id} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Image source={{ uri: pl.photo }} style={{ width: 56, height: 56, borderRadius: radii.md, backgroundColor: p.surfaceAlt }} />
            <View style={{ flex: 1 }}>
              <Ty variant="bodyStrong">{pl.name}</Ty>
              <Ty variant="bodySmall" muted>
                {pl.category} · {pl.rating.toFixed(1)} ★
              </Ty>
            </View>
            {i === 0 && candidates.length > 1 ? (
              <View style={{ backgroundColor: p.warnSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Ty variant="caption" color={p.warn} style={{ fontWeight: '700', fontSize: 10 }}>
                  Your pick
                </Ty>
              </View>
            ) : null}
          </Card>
        ))}
      </View>

      {/* Invitees */}
      {invitees.length > 0 ? (
        <>
          <Ty variant="title3" style={{ marginTop: space.xl, marginBottom: space.md }}>
            Invited
          </Ty>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <AvatarStack items={invitees.map((u) => ({ name: u.name, color: u.color, initials: u.initials }))} size={40} max={6} />
            <View style={{ justifyContent: 'center' }}>
              <Ty variant="bodySmall" muted>
                They will get a push notification
              </Ty>
            </View>
          </View>
        </>
      ) : null}

      {/* Smart reminder */}
      <Card style={{ marginTop: space.xl, flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ph name="Alarm" size={22} weight="duotone" color={p.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Ty variant="bodyStrong">Smart reminders</Ty>
          <Ty variant="bodySmall" muted>
            Auto reminders at 24h, 2h, 30m, 15m and 5m before
          </Ty>
        </View>
      </Card>
    </Screen>
  );
}

function Row({ icon, text }: { icon: any; text: string }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Ph name={icon} size={16} weight="duotone" color={p.accent} />
      <Ty variant="bodySmall" muted style={{ flex: 1 }}>
        {text}
      </Ty>
    </View>
  );
}
