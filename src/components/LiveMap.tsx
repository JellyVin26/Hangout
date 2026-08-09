import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { MapPin, NavigationArrow } from 'phosphor-react-native';
import { radii, space } from '@/theme/tokens';
import { useApp, usePalette } from '@/store/useApp';
import type { LiveSession, LiveTraveler, SharingMode } from '@/data/types';
import { Ty } from './Text';

type Pt = { x: number; y: number };

/** Progress at which a traveler is considered inside the 100 m geofence. */
const ARRIVE_P = 0.965;

const progressOf = (t: { startedAt: number; totalSec: number; status?: string }, nowMs: number) => {
  if (t.status === 'arrived') return 1;
  const elapsed = (nowMs - t.startedAt) / 1000;
  return Math.min(1, Math.max(0, elapsed / t.totalSec));
};

const bezierPoint = (from: Pt, control: Pt, to: Pt, t: number): Pt => {
  const mt = 1 - t;
  return {
    x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
    y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y,
  };
};

const bezierPath = (from: Pt, control: Pt, to: Pt) =>
  `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;

interface LiveMapProps {
  session: LiveSession;
  height?: number;
  onArrive?: (userId: string) => void;
  showLegend?: boolean;
  onNavigate?: () => void;
}

/**
 * The hero feature: a live arrival-coordination map.
 * Travelers move along quadratic bezier routes toward the destination.
 * Arrival is detected via a geofence around the destination.
 */
export function LiveMap({ session, height, onArrive, showLegend, onNavigate }: LiveMapProps) {
  const p = usePalette();
  const [width, setWidth] = useState(0);
  const mapH = height ?? 400;

  const positionsRef = useRef<Record<string, Pt>>({});
  const arrivedRef = useRef<Record<string, boolean>>({});
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  const [, force] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const nowMs = Date.now();
      const next: Record<string, Pt> = {};
      let changed = false;

      const consider = (key: string, t: LiveTraveler | (LiveSession['me'] & { startedAt?: number })) => {
        if ('sharing' in t && (!t.startedAt || t.sharing !== 'live')) return;
        const pv = progressOf(t as { startedAt: number; totalSec: number; status?: string }, nowMs);
        const pt = bezierPoint(t.from, t.control, session.destination.map, pv);
        const prev = positionsRef.current[key];
        if (!prev || Math.abs(prev.x - pt.x) > 0.35 || Math.abs(prev.y - pt.y) > 0.35) {
          next[key] = pt;
          changed = true;
        }
        if (pv >= ARRIVE_P && !arrivedRef.current[key]) {
          arrivedRef.current[key] = true;
          onArriveRef.current?.(key);
        }
      };

      Object.entries(session.travelers).forEach(([key, t]) => consider(key, t));
      if (session.me.sharing === 'live' && session.me.startedAt) consider('me', session.me);

      if (changed) {
        positionsRef.current = { ...positionsRef.current, ...next };
        force((n) => n + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const toCanvas = (pt: Pt): Pt => ({ x: (pt.x / 1000) * width, y: (pt.y / 1400) * mapH });

  const dest = toCanvas(session.destination.map);
  const travelers = Object.entries(session.travelers);
  const meTraveler: (LiveSession['me'] & { startedAt?: number }) | null =
    session.me.sharing === 'live' && session.me.startedAt ? session.me : null;

  return (
    <View style={[styles.wrap, { borderRadius: radii.card, overflow: 'hidden', height: mapH }]} onLayout={onLayout}>
      {width > 0 ? (
        <>
          <Svg width={width} height={mapH}>
            {/* base */}
            <Rect x={0} y={0} width={width} height={mapH} fill={p.mapBg} />
            {/* water */}
            <Ellipse cx={width * 0.16} cy={mapH * 0.16} rx={width * 0.22} ry={mapH * 0.14} fill={p.mapWater} />
            <Ellipse cx={width * 0.92} cy={mapH * 0.82} rx={width * 0.18} ry={mapH * 0.12} fill={p.mapWater} />
            {/* parks */}
            <Rect x={width * 0.63} y={mapH * 0.07} width={width * 0.26} height={mapH * 0.16} rx={18} fill={p.mapPark} />
            <Rect x={width * 0.1} y={mapH * 0.68} width={width * 0.22} height={mapH * 0.13} rx={14} fill={p.mapPark} />
            {/* city blocks */}
            {[
              [0.05, 0.3, 0.2, 0.09],
              [0.28, 0.12, 0.24, 0.09],
              [0.08, 0.48, 0.16, 0.1],
              [0.72, 0.42, 0.22, 0.09],
              [0.55, 0.62, 0.2, 0.1],
              [0.3, 0.86, 0.2, 0.08],
              [0.72, 0.9, 0.2, 0.08],
              [0.28, 0.3, 0.16, 0.09],
            ].map(([x, y, w, h], i) => (
              <Rect
                key={i}
                x={width * x}
                y={mapH * y}
                width={width * w}
                height={mapH * h}
                rx={8}
                fill={p.mapBlock}
              />
            ))}
            {/* main roads with edge */}
            <Rect x={0} y={mapH * 0.378} width={width} height={mapH * 0.034} fill={p.mapRoadEdge} />
            <Rect x={0} y={mapH * 0.384} width={width} height={mapH * 0.022} fill={p.mapRoad} />
            <Rect x={width * 0.462} y={0} width={width * 0.02} height={mapH} fill={p.mapRoadEdge} />
            <Rect x={width * 0.466} y={0} width={width * 0.012} height={mapH} fill={p.mapRoad} />
            {/* diagonal avenue */}
            <Path
              d={`M ${-width * 0.1} ${mapH * 0.62} L ${width * 1.05} ${mapH * 0.28}`}
              stroke={p.mapRoad}
              strokeWidth={mapH * 0.022}
            />
            {/* minor roads */}
            {[0.2, 0.52, 0.8].map((y, i) => (
              <Rect key={`h${i}`} x={0} y={mapH * y} width={width} height={1.5} fill={p.mapRoadEdge} opacity={0.8} />
            ))}
            {[0.18, 0.72, 0.9].map((x, i) => (
              <Rect key={`v${i}`} x={width * x} y={0} width={1.5} height={mapH} fill={p.mapRoadEdge} opacity={0.8} />
            ))}
            {/* geofence */}
            <Circle cx={dest.x} cy={dest.y} r={26} fill={p.accentSoft} opacity={0.5} />
            <Circle
              cx={dest.x}
              cy={dest.y}
              r={26}
              fill="none"
              stroke={p.accent}
              strokeWidth={1.4}
              strokeDasharray="4 5"
              opacity={0.7}
            />
            {/* traveler routes */}
            {travelers.map(([key, t]) => (
              <Path
                key={`r-${key}`}
                d={bezierPath(toCanvas(t.from), toCanvas(t.control), dest)}
                stroke={t.status === 'arrived' ? p.success : p.accent}
                strokeWidth={2}
                strokeDasharray="3 6"
                opacity={t.status === 'arrived' ? 0 : 0.65}
              />
            ))}
            {meTraveler ? (
              <Path
                d={bezierPath(toCanvas(meTraveler.from), toCanvas(meTraveler.control), dest)}
                stroke={p.ink}
                strokeWidth={2}
                strokeDasharray="3 6"
                opacity={0.65}
              />
            ) : null}
          </Svg>

          {/* destination pin */}
          <View style={[styles.pinWrap, { left: dest.x - 22, top: dest.y - 44 }]} pointerEvents="none">
            <PulseRing color={p.accent} />
            <MapPin size={44} weight="fill" color={p.accent} />
          </View>

          {/* live badge */}
          <View style={[styles.liveBadge, { backgroundColor: 'rgba(20,16,13,0.78)' }]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.success }} />
            <Ty variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
              Live
            </Ty>
          </View>

          {/* legend */}
          {showLegend ? (
            <View style={styles.legend}>
              {(
                [
                  ['arrived', p.success],
                  ['onway', p.accent],
                  ['late', p.warn],
                ] as const
              ).map(([k, c]) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
                  <Ty variant="caption" color={p.inkMuted} style={{ fontSize: 10 }}>
                    {k === 'arrived' ? 'Arrived' : k === 'onway' ? 'On the way' : 'Running late'}
                  </Ty>
                </View>
              ))}
            </View>
          ) : null}

          {/* travelers */}
          {travelers.map(([key, t]) => (
            <TravelerBadge
              key={key}
              userId={key}
              traveler={t}
              session={session}
              toCanvas={toCanvas}
              nowMs={Date.now()}
            />
          ))}
          {meTraveler ? (
            <TravelerBadge key="me" userId="me" traveler={meTraveler} session={session} toCanvas={toCanvas} nowMs={Date.now()} isMe />
          ) : null}

          {/* navigate */}
          {onNavigate ? (
            <View style={styles.navWrap}>
              <View style={[styles.navBtn, { backgroundColor: p.ink }]} onTouchEnd={onNavigate}>
                <NavigationArrow size={14} weight="bold" color={p.bg} />
                <Ty variant="caption" color={p.bg} style={{ fontWeight: '700' }}>
                  Navigate
                </Ty>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function TravelerBadge({
  userId,
  traveler,
  session,
  toCanvas,
  nowMs,
  isMe,
}: {
  userId: string;
  traveler: LiveTraveler | (LiveSession['me'] & { startedAt?: number });
  session: LiveSession;
  toCanvas: (pt: Pt) => Pt;
  nowMs: number;
  isMe?: boolean;
}) {
  const p = usePalette();
  const isMeT = isMe ?? false;
  const friends = useApp((s) => s.friends);
  const currentUser = useApp((s) => s.user);
  const userById = (id: string) => {
    if (currentUser?.id === id) return currentUser;
    return friends.find((u) => u.id === id) ?? { id, name: 'User', username: 'user', color: '#F0522F', initials: 'U', interests: [], badgeIds: [], hangoutCount: 0, placeCount: 0, friendIds: [] };
  };
  const user = isMeT ? userById('u_me') : userById(userId);
  const pv = progressOf(traveler as { startedAt: number; totalSec: number; status?: string }, nowMs);
  const pos = bezierPoint(traveler.from, traveler.control, session.destination.map, pv);
  const pt = toCanvas(pos);
  const status = 'status' in traveler ? traveler.status : pv >= ARRIVE_P ? 'arrived' : 'onway';
  const arrived = status === 'arrived' || pv >= ARRIVE_P;
  const remainingMin = Math.max(0, Math.ceil(((1 - pv) * traveler.totalSec) / 60));
  const color = arrived ? p.success : status === 'late' ? p.warn : p.accent;
  const size = 30;

  return (
    <View
      style={[
        styles.traveler,
        {
          left: pt.x - size / 2,
          top: pt.y - size / 2,
          zIndex: isMeT ? 20 : 10,
        },
      ]}
      pointerEvents="none"
    >
      {!arrived ? <PulseRing color={color} /> : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: user.color,
          borderWidth: 2.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ty variant="caption" color="#FFFFFF" style={{ fontSize: 10, fontWeight: '800' }}>
          {user.initials}
        </Ty>
      </View>
      <View
        style={[
          styles.travelerLabel,
          { backgroundColor: arrived ? p.success : p.surface },
          isMeT && { borderWidth: 1.5, borderColor: p.accent },
        ]}
      >
        <Ty variant="caption" color={arrived ? '#FFFFFF' : p.ink} style={{ fontSize: 10, fontWeight: '700' }}>
          {arrived ? 'Here' : isMeT ? `${remainingMin} min` : user.name.split(' ')[0]}
        </Ty>
      </View>
    </View>
  );
}

function PulseRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.7, duration: 1600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  pinWrap: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  legend: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(20,16,13,0.78)',
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  traveler: {
    position: 'absolute',
    alignItems: 'center',
  },
  travelerLabel: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  navWrap: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
});
