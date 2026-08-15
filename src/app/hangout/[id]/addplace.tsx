import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, MagnifyingGlass, Star } from 'phosphor-react-native';

import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { Ph } from '@/components/icons';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';

/** Add a place to vote on for an existing hangout (host or participants, before start). */
export default function AddPlaceScreen() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const places = useApp((s) => s.places);
  const vote = useApp((s) => s.vote);
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<typeof places | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemote(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = (await api(`/places?q=${encodeURIComponent(q)}&lat=1.29&lng=103.85`)) as Array<{
          id: string; name: string; category: string; address: string; rating: number;
          reviewCount: number; priceLevel: number; photoUrl?: string | null; openHours?: string | null;
          distanceKm?: number; tags?: string[]; lat?: number; lng?: number;
        }>;
        const mapped = data.map((r, i) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          address: r.address,
          rating: r.rating,
          reviewCount: r.reviewCount,
          priceLevel: Math.min(3, Math.max(1, r.priceLevel)) as 1 | 2 | 3,
          photo: r.photoUrl ?? '',
          hours: r.openHours ?? '',
          distanceKm: r.distanceKm ?? 0,
          tags: r.tags ?? [],
          map: { x: (i * 137) % 900 + 50, y: ((i * 211) % 1200) + 80 },
          lat: r.lat,
          lng: r.lng,
        }));
        setRemote(mapped);
      } catch {
        // silent — keep local list
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const list = useMemo(() => remote ?? places, [remote, places]);
  const filtered = list.filter((pl) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      pl.name.toLowerCase().includes(q) ||
      pl.category.toLowerCase().includes(q) ||
      pl.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const pick = async (placeId: string) => {
    if (busy) return;
    setBusy(placeId);
    try {
      await vote(id, placeId);
      toast('Place added to the vote', 'success');
      router.back();
    } catch {
      toast('Could not add place', 'info');
      setBusy(null);
    }
  };

  return (
    <Screen header={{ back: true, title: 'Add a place to vote' }} contentStyle={{ paddingHorizontal: space.screen }}>
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
          placeholder="Search places…"
          placeholderTextColor={p.inkFaint}
          style={{ flex: 1, fontFamily: 'Sora_400Regular', fontSize: 15, color: p.ink }}
          autoFocus
        />
        {loading ? <ActivityIndicator size="small" color={p.accent} /> : null}
      </View>

      <View style={{ gap: 10 }}>
        {filtered.map((pl) => (
          <Pressable key={pl.id} onPress={() => pick(pl.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: p.surface, borderRadius: radii.card, borderWidth: 1, borderColor: p.line, padding: space.md }}>
              {pl.photo ? (
                <Image source={{ uri: pl.photo }} style={{ width: 56, height: 56, borderRadius: radii.md, backgroundColor: p.surfaceAlt }} />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: radii.md, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Ph name="MapPin" size={22} weight="duotone" color={p.accent} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Ty variant="bodyStrong" numberOfLines={1}>{pl.name}</Ty>
                <Ty variant="bodySmall" muted numberOfLines={1}>
                  {pl.category}
                  {pl.rating > 0 ? ` · ${pl.rating.toFixed(1)} ★` : ''}
                </Ty>
                <Ty variant="caption" faint numberOfLines={1}>{pl.address}</Ty>
              </View>
              {busy === pl.id ? (
                <ActivityIndicator size="small" color={p.accent} />
              ) : (
                <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: p.accent, backgroundColor: p.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={15} weight="bold" color="#FFFFFF" />
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
