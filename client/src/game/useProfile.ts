import { create } from 'zustand';

const PROFILE_KEY = 'property_rush_profile';

export interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const QUESTS: Quest[] = [
  { id: 'first_win', name: 'First Victory', description: 'Win your first game', icon: '🏆' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Win a game in under 15 turns', icon: '⚡' },
  { id: 'pacifist', name: 'Pacifist', description: 'Win without playing any action cards', icon: '🕊️' },
  { id: 'mogul', name: 'Property Mogul', description: 'Collect all 10 property colors in one game', icon: '🏙️' },
  { id: 'streak_3', name: 'Hot Streak', description: 'Win 3 games in a row', icon: '🔥' },
  { id: 'banker', name: 'Big Banker', description: 'Have $20M+ in the bank when you win', icon: '💰' },
  { id: 'full_house', name: 'Full House', description: 'Win a 4-player game', icon: '👥' },
  { id: 'deal_breaker', name: 'Deal Breaker', description: 'Win a game after using a Deal Breaker', icon: '💎' },
  { id: 'veteran', name: 'Veteran', description: 'Play 10 games', icon: '🎖️' },
  { id: 'dominator', name: 'Dominator', description: 'Win 5 games total', icon: '👑' },
];

export interface ProfileData {
  playerName: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  currentStreak: number;
  bestStreak: number;
  friends: string[];
  questsCompleted: Record<string, boolean>;
  usedActionInGame: boolean;
  usedDealBreakerInGame: boolean;
}

interface ProfileStore extends ProfileData {
  setPlayerName: (name: string) => void;
  addFriend: (name: string) => void;
  removeFriend: (name: string) => void;
  recordGameResult: (won: boolean, extra?: {
    turnNumber?: number;
    playerCount?: number;
    bankValue?: number;
    propertyColors?: number;
    usedAction?: boolean;
    usedDealBreaker?: boolean;
  }) => void;
  markQuest: (questId: string) => void;
  resetGameFlags: () => void;
  setUsedAction: () => void;
  setUsedDealBreaker: () => void;
}

function loadProfile(): Partial<ProfileData> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveProfile(data: ProfileData) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch {}
}

const defaults: ProfileData = {
  playerName: 'Player',
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  currentStreak: 0,
  bestStreak: 0,
  friends: [],
  questsCompleted: {},
  usedActionInGame: false,
  usedDealBreakerInGame: false,
};

const saved = loadProfile();
const initial: ProfileData = { ...defaults, ...saved };

export const useProfile = create<ProfileStore>((set, get) => ({
  ...initial,

  setPlayerName: (name: string) => {
    const trimmed = name.trim().slice(0, 20) || 'Player';
    set({ playerName: trimmed });
    saveProfile({ ...get(), playerName: trimmed } as ProfileData);
  },

  addFriend: (name: string) => {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed) return;
    const current = get().friends;
    if (current.includes(trimmed)) return;
    const updated = [...current, trimmed];
    set({ friends: updated });
    saveProfile({ ...get(), friends: updated } as ProfileData);
  },

  removeFriend: (name: string) => {
    const updated = get().friends.filter(f => f !== name);
    set({ friends: updated });
    saveProfile({ ...get(), friends: updated } as ProfileData);
  },

  resetGameFlags: () => {
    set({ usedActionInGame: false, usedDealBreakerInGame: false });
  },

  setUsedAction: () => {
    set({ usedActionInGame: true });
  },

  setUsedDealBreaker: () => {
    set({ usedDealBreakerInGame: true });
  },

  markQuest: (questId: string) => {
    const state = get();
    if (state.questsCompleted[questId]) return;
    const updated = { ...state.questsCompleted, [questId]: true };
    set({ questsCompleted: updated });
    saveProfile({ ...state, questsCompleted: updated } as ProfileData);
  },

  recordGameResult: (won, extra) => {
    const state = get();
    const gamesPlayed = state.gamesPlayed + 1;
    const gamesWon = state.gamesWon + (won ? 1 : 0);
    const gamesLost = state.gamesLost + (won ? 0 : 1);
    const currentStreak = won ? state.currentStreak + 1 : 0;
    const bestStreak = Math.max(state.bestStreak, currentStreak);

    const questsCompleted = { ...state.questsCompleted };

    if (won) {
      questsCompleted['first_win'] = true;
      if (extra?.turnNumber && extra.turnNumber < 15) questsCompleted['speed_demon'] = true;
      if (!state.usedActionInGame) questsCompleted['pacifist'] = true;
      if (extra?.propertyColors && extra.propertyColors >= 10) questsCompleted['mogul'] = true;
      if (currentStreak >= 3) questsCompleted['streak_3'] = true;
      if (extra?.bankValue && extra.bankValue >= 20) questsCompleted['banker'] = true;
      if (extra?.playerCount && extra.playerCount >= 4) questsCompleted['full_house'] = true;
      if (state.usedDealBreakerInGame) questsCompleted['deal_breaker'] = true;
      if (gamesWon >= 5) questsCompleted['dominator'] = true;
    }
    if (gamesPlayed >= 10) questsCompleted['veteran'] = true;

    const updated = {
      gamesPlayed,
      gamesWon,
      gamesLost,
      currentStreak,
      bestStreak,
      questsCompleted,
      usedActionInGame: false,
      usedDealBreakerInGame: false,
    };

    set(updated);
    saveProfile({ ...state, ...updated } as ProfileData);
  },
}));
