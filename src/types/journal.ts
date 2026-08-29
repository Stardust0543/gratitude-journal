export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodOption {
  score: MoodScore;
  emoji: string;
  label: string;
  color: string;
}

export interface JournalEntry {
  id: string; // ISO date format YYYY-MM-DD or unique string
  date: string; // YYYY-MM-DD
  items: string[]; // List of 3 things user is grateful for
  affirmation?: string; // Daily positive affirmation
  mood: MoodScore; // 1-5
  photos?: string[]; // Base64 data URLs or image URLs
  tags?: string[]; // Array of tag strings
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  syncStatus?: 'local' | 'synced' | 'pending';
}

export interface SyncSettings {
  autoSync: boolean;
  cloudProvider: 'none' | 'gdrive' | 'notion';
  gdriveFolderId?: string;
  gdriveAccessToken?: string;
  gdriveUserEmail?: string;
  notionApiKey?: string;
  notionDatabaseId?: string;
  lastSyncedAt?: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  lastEntryDate: string | null;
}
