import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MagnifyingGlass, Star } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { useDraft } from '@/store/useDraft';
import { PLACES } from '@/data/seed';
import { CATEGORIES } from '@/data/types';
import { Screen } from '@/components/Screen';
import { ChipRow } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';

export default function PlacePickerScreen() {
  const p = usePalette();
  const router = useRouter();
  const draft = useDraft();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');

  const filtered = PLACES.filter((pl) => {
    const matchCat = cat === 'All' || pl.category === cat;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      pl.name.toLowerCase().includes(q) ||
      pl.category.toLowerCase().includes(q) ||
      pl.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const toggle = (cid: string) => {
    const has = draft.candidateIds.includes(cid);
    if (has) {
      draft.set({ candidateIds: draft.candidateIds.filter((c) => c !== cid) });
    } else {
      if (draft.candidateIds.length >= 3) {
        toast('You can vote on up to 3 places');
        return;
      }
      draft.set({ candidateIds: [...draft.candidateIds, cid] });
    }
  };

  return (
    <Screen
      header={{ back: true, title: 'Pick a place' }}
      footer={
        draft.candidateIds.length > 0 ? (
          <Button
            label={`Done · ${draft.candidateIds.length} selected`}
            icon="Check"
            fullWidth
            size="lg"
            onPress={() => router.back()}
          />
        ) : undefined
      }
      contentStyle={{ paddingHorizontal: space.screen }}
    >
      {/* Search */}
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
          marginBottom: space.md,
        }}
      >
        <MagnifyingGlass size={20} weight="bold" color={p.inkFaint} />
        <Ty variant="body" style={{ flex: 1 }} color={query ? p.ink : p.inkFaint}>
          {query || 'Search places on Google Maps'}
        </Ty>
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ph name="X" size={18} weight="bold" color={p.inkFaint} />
          </Pressable>
        ) : null}
      </View>
      {/* Category filter */}
      <ChipRow
        options={[{ label: 'All', value: 'All' }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]}
        value={cat}
        onChange={setCat}
      />

      {/* Results */}
      <View style={{ gap: space.md, marginTop: space.lg }}>
        {filtered.map((pl) => {
          const selected = draft.candidateIds.includes(pl.id);
          return (
            <Pressable key={pl.id} onPress={() => toggle(pl.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: space.md,
                  backgroundColor: p.surface,
                  borderRadius: radii.card,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? p.accent : p.line,
                  padding: space.sm,
                }}
              >
                <Image source={{ uri: pl.photo }} style={{ width: 72, height: 72, borderRadius: radii.md, backgroundColor: p.surfaceAlt }} />
                <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ty variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {pl.name}
                    </Ty>
                    {selected ? (
                      <View style={{ backgroundColor: p.accent, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} weight="bold" color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <Ty variant="bodySmall" muted numberOfLines={1}>
                    {pl.category} · {pl.address}
                  </Ty>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Star size={12} weight="fill" color={p.warn} />
                    <Ty variant="caption" style={{ fontWeight: '600' }}>
                      {pl.rating.toFixed(1)}
                    </Ty>
                    <Ty variant="caption" faint>
                      ({pl.reviewCount}) · {pl.distanceKm.toFixed(1)} km · {pl.priceLevel === 1 ? '$' : pl.priceLevel === 2 ? '$$' : '$$$'}
                    </Ty>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
        {filtered.length === 0 ? (
          <Ty variant="bodySmall" muted center style={{ marginTop: space.xxl }}>
            No places match "{query}"
          </Ty>
        ) : null}
      </View>
    </Screen>
  );
}
