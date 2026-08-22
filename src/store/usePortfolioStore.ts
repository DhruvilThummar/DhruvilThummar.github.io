import { create } from 'zustand';
import { getCacheItem, setCacheItem, STORES } from '@/lib/db';
import { profileData, Profile } from '@/data/profile';

interface UserPreferences {
  motionEnabled: boolean;
  activeChapter: string;
  telemetryEnabled: boolean;
}

interface PortfolioState {
  isPreloaderComplete: boolean;
  cachedProfile: Profile | null;
  activeChapter: string;
  userPrefs: UserPreferences;
  isHydrated: boolean;

  setPreloaderComplete: (complete: boolean) => void;
  setActiveChapter: (chapter: string) => void;
  hydrateFromDB: () => Promise<boolean>;
  persistUserPrefs: (prefs: Partial<UserPreferences>) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  isPreloaderComplete: false,
  cachedProfile: null,
  activeChapter: 'hero',
  userPrefs: {
    motionEnabled: true,
    activeChapter: 'hero',
    telemetryEnabled: true,
  },
  isHydrated: false,

  setPreloaderComplete: (complete: boolean) => {
    set({ isPreloaderComplete: complete });
  },

  setActiveChapter: (chapter: string) => {
    set((state) => ({
      activeChapter: chapter,
      userPrefs: { ...state.userPrefs, activeChapter: chapter },
    }));

    // Persist chapter change asynchronously to IndexedDB & localStorage
    get().persistUserPrefs({ activeChapter: chapter });
  },

  hydrateFromDB: async () => {
    try {
      // Hydrate profile data from IndexedDB
      const cachedProfile = await getCacheItem<Profile>(STORES.ASSETS_CACHE, 'profile_schema');
      const cachedPrefs = await getCacheItem<UserPreferences>(STORES.USER_PREFS, 'preferences');

      if (cachedProfile) {
        set({ cachedProfile, isHydrated: true });
      } else {
        // First load: Cache static profileData into IndexedDB
        await setCacheItem(STORES.ASSETS_CACHE, 'profile_schema', profileData);
        set({ cachedProfile: profileData, isHydrated: true });
      }

      if (cachedPrefs) {
        set((state) => ({
          userPrefs: { ...state.userPrefs, ...cachedPrefs },
          activeChapter: cachedPrefs.activeChapter || 'hero',
        }));
      }

      return !!cachedProfile;
    } catch (error) {
      console.warn('[Zustand] Hydration fallback to static defaults:', error);
      set({ cachedProfile: profileData, isHydrated: true });
      return false;
    }
  },

  persistUserPrefs: async (newPrefs: Partial<UserPreferences>) => {
    try {
      const updated = { ...get().userPrefs, ...newPrefs };
      set({ userPrefs: updated });

      // Save to IndexedDB
      await setCacheItem(STORES.USER_PREFS, 'preferences', updated);

      // Save key settings to localStorage for dual redundancy
      if (typeof window !== 'undefined') {
        localStorage.setItem('drthummar_active_chapter', updated.activeChapter);
      }
    } catch (error) {
      console.warn('[Zustand] Failed to persist user preferences:', error);
    }
  },
}));
