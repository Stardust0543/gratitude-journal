import Dexie, { type Table } from 'dexie';
import type { JournalEntry, StreakStats } from '../types/journal';
import { parseISO, subDays, format, differenceInDays } from 'date-fns';


export class GratitudeDatabase extends Dexie {
  entries!: Table<JournalEntry, string>;

  constructor() {
    super('GratitudeJournalDB');
    this.version(1).stores({
      entries: 'id, date, mood, createdAt, updatedAt'
    });
  }
}

export const db = new GratitudeDatabase();

// --- Helper DB Actions ---

export async function saveJournalEntry(entry: Omit<JournalEntry, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): Promise<JournalEntry> {
  const now = new Date().toISOString();
  const existing = await db.entries.get(entry.id);

  const fullEntry: JournalEntry = {
    ...entry,
    createdAt: existing?.createdAt || entry.createdAt || now,
    updatedAt: now,
    syncStatus: 'pending'
  };

  await db.entries.put(fullEntry);
  return fullEntry;
}

export async function getEntryByDate(dateStr: string): Promise<JournalEntry | undefined> {
  return await db.entries.where('date').equals(dateStr).first();
}

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  return await db.entries.orderBy('date').reverse().toArray();
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}

export async function searchEntries(query: string, tagFilter?: string, moodFilter?: number): Promise<JournalEntry[]> {
  let entries = await getAllJournalEntries();

  if (query.trim()) {
    const q = query.toLowerCase();
    entries = entries.filter(entry => 
      entry.items.some(item => item.toLowerCase().includes(q)) ||
      (entry.affirmation && entry.affirmation.toLowerCase().includes(q)) ||
      (entry.tags && entry.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  if (tagFilter) {
    entries = entries.filter(entry => entry.tags && entry.tags.includes(tagFilter));
  }

  if (moodFilter) {
    entries = entries.filter(entry => entry.mood === moodFilter);
  }

  return entries;
}

export async function calculateStreakStats(): Promise<StreakStats> {
  const allEntries = await db.entries.orderBy('date').reverse().toArray();

  if (allEntries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      lastEntryDate: null,
    };
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const uniqueDates = Array.from(new Set(allEntries.map(e => e.date))).sort().reverse();
  const lastEntryDate = uniqueDates[0];

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();

  // If entry exists for today or yesterday, streak is alive
  if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
    // Determine start date for backwards counting
    if (!uniqueDates.includes(todayStr)) {
      checkDate = subDays(new Date(), 1);
    }
    
    while (true) {
      const dateString = format(checkDate, 'yyyy-MM-dd');
      if (uniqueDates.includes(dateString)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;

  const sortedAscDates = [...uniqueDates].sort();
  for (let i = 0; i < sortedAscDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = parseISO(sortedAscDates[i - 1]);
      const currDate = parseISO(sortedAscDates[i]);
      const diff = differenceInDays(currDate, prevDate);

      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalEntries: allEntries.length,
    lastEntryDate,
  };
}

export async function exportAllDataJSON(): Promise<string> {
  const entries = await getAllJournalEntries();
  const exportPayload = {
    appName: 'GratitudeJournal',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function importDataJSON(jsonString: string): Promise<number> {
  try {
    const data = JSON.parse(jsonString);
    const entriesToImport: JournalEntry[] = Array.isArray(data) ? data : data.entries;
    if (!Array.isArray(entriesToImport)) {
      throw new Error('Invalid JSON format: entries array missing');
    }

    let importedCount = 0;
    for (const entry of entriesToImport) {
      if (entry.id && entry.date && Array.isArray(entry.items)) {
        await db.entries.put({
          ...entry,
          syncStatus: 'synced',
          updatedAt: entry.updatedAt || new Date().toISOString()
        });
        importedCount++;
      }
    }
    return importedCount;
  } catch (err) {
    console.error('Import failed', err);
    throw err;
  }
}
