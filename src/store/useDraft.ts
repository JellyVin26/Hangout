import { create } from 'zustand';
import type { Category, Visibility } from '@/data/types';
import { atDayOffset } from '@/lib/format';

export interface DraftState {
  title: string;
  description: string;
  at: number;
  durationMin: number;
  category: Category;
  visibility: Visibility;
  maxParticipants?: number;
  candidateIds: string[];
  inviteeIds: string[];
  set: (patch: Partial<DraftState>) => void;
  reset: () => void;
}

const defaults = (): Omit<DraftState, 'set' | 'reset'> => ({
  title: '',
  description: '',
  at: atDayOffset(1, 19, 0),
  durationMin: 120,
  category: 'Cafe',
  visibility: 'friends',
  maxParticipants: undefined,
  candidateIds: [],
  inviteeIds: [],
});

export const useDraft = create<DraftState>((set) => ({
  ...defaults(),
  set: (patch) => set(patch),
  reset: () => set(defaults()),
}));
