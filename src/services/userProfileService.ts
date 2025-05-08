// src/services/userProfileService.ts

// Placeholder data structure for achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: any; // Keeping generic for now, can be React.ReactNode if icons are components
  unlocked: boolean;
  progress?: number;
  goal?: number;
}

// Placeholder user data structure
export interface UserProfile {
  username: string;
  gameName: string;
  avatarUrl?: string;
}

const USER_PROFILE_STORAGE_KEY = 'heroStoryUserProfile';
const ACHIEVEMENTS_STORAGE_KEY = 'heroStoryUserAchievements';

// NOTE: This service uses localStorage and should only be called from client-side components.
// It is NOT a server action.

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // console.log("Client-side: Saving user profile to localStorage.");
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      console.warn("localStorage is not available. User profile not saved.");
    }
  } catch (error) {
    console.error("Failed to save user profile to localStorage:", error);
    throw new Error("Failed to save user profile.");
  }
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  // console.log("Client-side: Loading user profile from localStorage.");
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedProfile = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (storedProfile) {
        return JSON.parse(storedProfile) as UserProfile;
      }
      return null;
    }
    console.warn("localStorage is not available. Cannot load user profile.");
    return null;
  } catch (error) {
    console.error("Failed to load user profile from localStorage:", error);
    return null;
  }
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  // console.log("Client-side: Saving achievements to localStorage.");
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
    } else {
      console.warn("localStorage is not available. Achievements not saved.");
    }
  } catch (error) {
    console.error("Failed to save achievements to localStorage:", error);
    throw new Error("Failed to save achievements.");
  }
}

export async function loadAchievements(initialAchievements: Achievement[]): Promise<Achievement[]> {
  // console.log("Client-side: Loading achievements from localStorage.");
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (storedAchievements) {
        const parsedAchievements: Achievement[] = JSON.parse(storedAchievements);
        // Merge with initial to ensure all achievements are present, preserving unlocked status and progress
        const mergedAchievements = initialAchievements.map(initAch => {
          const found = parsedAchievements.find(storedAch => storedAch.id === initAch.id);
          // Ensure progress is a number, default to 0 if undefined or not a number
          const progress = (found && typeof found.progress === 'number') ? found.progress : 0;
          return found ? { ...initAch, unlocked: found.unlocked, progress: progress } : { ...initAch, progress: initAch.progress || 0 };
        });
        return mergedAchievements;
      }
      return initialAchievements.map(ach => ({ ...ach, progress: ach.progress || 0 })); // Return initial if nothing stored, ensuring progress
    }
    console.warn("localStorage is not available. Cannot load achievements.");
    return initialAchievements.map(ach => ({ ...ach, progress: ach.progress || 0 })); // Return initial on error, ensuring progress
  } catch (error) {
    console.error("Failed to load achievements from localStorage:", error);
    return initialAchievements.map(ach => ({ ...ach, progress: ach.progress || 0 })); // Return initial on error, ensuring progress
  }
}
