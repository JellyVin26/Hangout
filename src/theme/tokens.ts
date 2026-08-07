/**
 * Hangout design tokens.
 * One palette per theme (light / dark), one accent (ember), one radius system.
 * Ember coral on warm paper + ink. No pure black, no pure white.
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  screen: 20, // standard screen horizontal padding
} as const;

/** Corner radius scale. Rule: buttons are full-pill, cards 20, inputs 14. */
export const radii = {
  xs: 8, // chips, badges, small tags
  sm: 10,
  md: 12, // small containers, inner elements
  input: 14, // text inputs, search fields
  card: 20, // cards, list rows, sheets
  xl: 26, // hero cards, modals
  pill: 999,
} as const;

export type Palette = typeof palettes.light;

export const palettes = {
  light: {
    mode: 'light',
    bg: '#FAF7F3',
    surface: '#FFFFFF',
    surfaceAlt: '#F3EEE8',
    surfaceElevated: '#FFFFFF',
    ink: '#211B17',
    inkMuted: '#6F655D',
    inkFaint: '#A79C93',
    line: '#EAE3DC',
    accent: '#F0522F',
    accentDeep: '#D8421E',
    accentSoft: '#FCEAE3',
    onAccent: '#FFFFFF',
    success: '#1F9D5C',
    successSoft: '#E2F3EA',
    warn: '#C77E00',
    warnSoft: '#FBF0D9',
    danger: '#D64545',
    idle: '#9C928A',
    idleSoft: '#F0EBE5',
    overlay: 'rgba(33,27,23,0.45)',
    overlayDeep: 'rgba(33,27,23,0.72)',
    shadow: '#3A2A1E',
    mapBg: '#EFE9E2',
    mapRoad: '#FFFFFF',
    mapRoadEdge: '#E3DCD3',
    mapPark: '#DDE7D6',
    mapWater: '#D5E2EA',
    mapBlock: '#E7E0D8',
    navActive: '#F0522F',
    navInactive: '#A79C93',
    tabBar: 'rgba(250,247,243,0.92)',
    thumb: '#211B17',
    track: '#E3DCD4',
  },
  dark: {
    mode: 'dark',
    bg: '#16120F',
    surface: '#211C18',
    surfaceAlt: '#2A241F',
    surfaceElevated: '#2A241F',
    ink: '#F5F0EB',
    inkMuted: '#B0A69D',
    inkFaint: '#7E746B',
    line: '#352D27',
    accent: '#FF5B36',
    accentDeep: '#F04A24',
    accentSoft: '#3A2118',
    onAccent: '#FFFFFF',
    success: '#3FC47F',
    successSoft: '#1B3627',
    warn: '#F0B232',
    warnSoft: '#3A2F13',
    danger: '#F2716A',
    idle: '#8F857C',
    idleSoft: '#2C2621',
    overlay: 'rgba(10,8,7,0.6)',
    overlayDeep: 'rgba(10,8,7,0.8)',
    shadow: '#000000',
    mapBg: '#1F1A16',
    mapRoad: '#2B2520',
    mapRoadEdge: '#241F1A',
    mapPark: '#24311F',
    mapWater: '#1C2A32',
    mapBlock: '#262019',
    navActive: '#FF5B36',
    navInactive: '#7E746B',
    tabBar: 'rgba(22,18,15,0.92)',
    thumb: '#F5F0EB',
    track: '#3A332D',
  },
} as const;

/** Type scale. Sora family, weight-driven hierarchy. */
export const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.6 },
  title1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  title2: { fontSize: 21, lineHeight: 27, fontWeight: '700' as const, letterSpacing: -0.2 },
  title3: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const, letterSpacing: 0 },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const, letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0 },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0.8 },
  bigNumber: { fontSize: 42, lineHeight: 44, fontWeight: '800' as const, letterSpacing: -1 },
} as const;

export const fontFamily = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
  extrabold: 'Sora_800ExtraBold',
} as const;

/** Soft, warm-tinted shadows. Never pure black on light surfaces. */
export const shadows = {
  sm: {
    shadowColor: '#3A2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#3A2A1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3A2A1E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const avatarColors = [
  '#F0522F', // ember
  '#E8A200', // amber
  '#1F9D5C', // green
  '#2F6FED', // blue
  '#8B5CF6', // violet
  '#D64588', // pink
  '#0E9AA7', // teal
  '#C77E00', // ochre
] as const;
