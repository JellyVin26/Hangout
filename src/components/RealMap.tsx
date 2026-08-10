import { useEffect, useRef, useState } from 'react';
import { Animated, Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, Region } from 'react-native-maps';
import { MapPin } from 'phosphor-react-native';
import { radii } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';

interface TravelerFix {
  id: string;
  lat: number;
  lng: number;
  status?: 'arrived' | 'onway' | 'late' | 'idle';
  name: string;
  initials: string;
  color: string;
  isMe?: boolean;
}

interface RealMapProps {
  destination: { lat: number; lng: number; name: string };
  travelers?: TravelerFix[];
  routeFor?: (id: string) => Array<{ latitude: number; longitude: number }> | undefined;
  meTrail?: Array<{ latitude: number; longitude: number }>;
  height?: number;
}

/**
 * Real Google Maps tile view used in the live arrival screen once we have a
 * destination lat/lng. Travelers are positioned from real GPS fixes; the
 * custom bezier animation only runs as a fallback when the user opted in to
 * "ETA only" mode (no live coords).
 */
export function RealMap({ destination, travelers = [], routeFor, meTrail, height }: RealMapProps) {
  const p = usePalette();
  const [width, setWidth] = useState(0);
  const mapH = height ?? 380;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const mapRef = useRef<MapView | null>(null);

  const initialRegion: Region = {
    latitude: destination.lat,
    longitude: destination.lng,
    latitudeDelta: 0.018,
    longitudeDelta: 0.018,
  };

  useEffect(() => {
    if (!mapRef.current || !width) return;
    const coords = travelers
      .filter((t) => Number.isFinite(t.lat) && Number.isFinite(t.lng))
      .map((t) => ({ latitude: t.lat, longitude: t.lng }));
    coords.push({ latitude: destination.lat, longitude: destination.lng });
    if (coords.length > 1) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, bottom: 60, left: 60, right: 60 },
        animated: true,
      });
    }
  }, [travelers, destination.lat, destination.lng, width]);

  return (
    <View style={[styles.wrap, { height: mapH }]} onLayout={onLayout}>
      {width > 0 ? (
        <MapView
          ref={mapRef}
          style={{ width, height: mapH }}
          provider="google"
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          loadingEnabled
          loadingBackgroundColor={p.bg}
          loadingIndicatorColor={p.accent}
        >
          <Circle
            center={{ latitude: destination.lat, longitude: destination.lng }}
            radius={100}
            strokeColor={p.accent}
            fillColor="rgba(240,82,47,0.18)"
            strokeWidth={1.5}
          />

          {travelers.map((t) => {
            if (!Number.isFinite(t.lat) || !Number.isFinite(t.lng)) return null;
            const color = t.status === 'arrived' ? p.success : t.status === 'late' ? p.warn : p.accent;
            const route = routeFor?.(t.id);
            return (
              <View key={`t-${t.id}`}>
                {route && route.length > 1 ? (
                  <Polyline
                    coordinates={route}
                    strokeColor={t.isMe ? p.ink : color}
                    strokeWidth={2.5}
                    lineDashPattern={[6, 8]}
                  />
                ) : null}
                <Marker coordinate={{ latitude: t.lat, longitude: t.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[styles.bubble, { borderColor: color, backgroundColor: t.color }]}>
                    <PinLabel initials={t.initials} color={color} />
                  </View>
                </Marker>
              </View>
            );
          })}

          {meTrail && meTrail.length > 1 ? (
            <Polyline
              coordinates={meTrail}
              strokeColor={p.ink}
              strokeWidth={2.5}
              lineDashPattern={[6, 8]}
            />
          ) : null}

          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.destPin}>
              <MapPin size={36} weight="fill" color={p.accent} />
            </View>
          </Marker>
        </MapView>
      ) : null}

      <View style={styles.liveBadge}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.success }} />
        <Animated.Text style={[styles.liveText, { color: '#FFFFFF' }]}>Live</Animated.Text>
      </View>
    </View>
  );
}

function PinLabel({ initials, color }: { initials: string; color: string }) {
  return (
    <View pointerEvents="none">
      <Animated.Text style={[styles.bubbleLabel, { color: '#FFFFFF' }]}>{initials}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.card,
    backgroundColor: '#1a1a1a',
  },
  destPin: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(20,16,13,0.78)',
  },
  liveText: { fontSize: 11, fontWeight: '700' },
});