import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TodayEntryForm } from './components/TodayEntryForm';
import { TimelineView } from './components/TimelineView';
import { CalendarView } from './components/CalendarView';
import { StreakStatsComponent } from './components/StreakStats';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { MobileBottomNav, type TabType } from './components/MobileBottomNav';
import {
  saveJournalEntry,
  getAllJournalEntries,
  deleteJournalEntry,
  calculateStreakStats,
  getEntryByDate
} from './db/journalDb';
import { pushToGoogleDrive, pullFromGoogleDrive } from './services/googleDriveSync';
import { syncEntryToNotion } from './services/notionSync';
import type { JournalEntry, StreakStats, SyncSettings } from './types/journal';

import { format } from 'date-fns';
import { PenTool, Clock, Calendar, BarChart3 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalEntries: 0,
    lastEntryDate: null
  });

  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load sync settings from localStorage
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(() => {
    const saved = localStorage.getItem('gratitude_sync_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      autoSync: true,
      cloudProvider: 'none'
    };
  });

  // Reload data from IndexedDB
  const refreshData = useCallback(async () => {
    const all = await getAllJournalEntries();
    setEntries(all);
    const stats = await calculateStreakStats();
    setStreakStats(stats);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSaveSettings = (newSettings: SyncSettings) => {
    setSyncSettings(newSettings);
    localStorage.setItem('gratitude_sync_settings', JSON.stringify(newSettings));
  };

  const handleSaveEntry = async (entryData: Omit<JournalEntry, 'createdAt' | 'updatedAt'>) => {
    const saved = await saveJournalEntry(entryData);
    await refreshData();
    setEditingEntry(undefined);

    // Auto sync to cloud if enabled
    if (syncSettings.cloudProvider === 'gdrive' && syncSettings.gdriveAccessToken) {
      try {
        setIsSyncing(true);
        await pushToGoogleDrive(syncSettings.gdriveAccessToken);
      } catch (e) {
        console.error('Google Drive Auto Sync Error:', e);
      } finally {
        setIsSyncing(false);
      }
    } else if (syncSettings.cloudProvider === 'notion' && syncSettings.notionApiKey && syncSettings.notionDatabaseId) {
      try {
        setIsSyncing(true);
        await syncEntryToNotion(saved, syncSettings.notionApiKey, syncSettings.notionDatabaseId);
      } catch (e) {
        console.error('Notion Auto Sync Error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteJournalEntry(id);
    await refreshData();
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setSelectedDateStr(entry.date);
    setActiveTab('today');
  };

  const handleSelectDateFromCalendar = async (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const existing = await getEntryByDate(dateStr);
    setEditingEntry(existing);
    setActiveTab('today');
  };

  const handleQuickSync = async () => {
    if (syncSettings.cloudProvider === 'gdrive' && syncSettings.gdriveAccessToken) {
      setIsSyncing(true);
      try {
        await pushToGoogleDrive(syncSettings.gdriveAccessToken);
        await pullFromGoogleDrive(syncSettings.gdriveAccessToken);
        await refreshData();
        alert('Google Drive와 최근 변경사항이 성공적으로 동기화되었습니다!');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        alert(`동기화 오류: ${msg}`);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSettingsOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/80 via-orange-50/30 to-amber-100/40 text-slate-800 pb-20 sm:pb-8">
      
      {/* Top Navbar */}
      <Navbar
        streak={streakStats}
        syncSettings={syncSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickSync={handleQuickSync}
        isSyncing={isSyncing}
      />

      {/* Desktop Top Tab Navigation */}
      <div className="hidden sm:flex items-center justify-center my-6">
        <div className="bg-white/80 backdrop-blur-xs p-1.5 rounded-2xl border border-amber-200/70 shadow-xs flex items-center gap-1">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
            }`}
          >
            <PenTool className="w-4 h-4" /> 오늘 작성
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4" /> 타임라인
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
            }`}
          >
            <Calendar className="w-4 h-4" /> 달력
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> 통계 및 리포트
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 px-4 py-4 sm:py-2">
        {activeTab === 'today' && (
          <TodayEntryForm
            initialEntry={editingEntry}
            onSave={handleSaveEntry}
            selectedDateStr={selectedDateStr}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            entries={entries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            entries={entries}
            onSelectDate={handleSelectDateFromCalendar}
            onEditEntry={handleEditEntry}
          />
        )}

        {activeTab === 'stats' && (
          <StreakStatsComponent
            stats={streakStats}
            entries={entries}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Privacy & Cloud Sync Settings Modal */}
      <SyncSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={syncSettings}
        onSaveSettings={handleSaveSettings}
        onDataImported={refreshData}
      />

    </div>
  );
}
