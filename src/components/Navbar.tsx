import React from 'react';
import { Heart, Flame, Settings, Cloud, RefreshCw } from 'lucide-react';
import type { StreakStats, SyncSettings } from '../types/journal';


interface NavbarProps {
  streak: StreakStats;
  syncSettings: SyncSettings;
  onOpenSettings: () => void;
  onQuickSync?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  streak,
  syncSettings,
  onOpenSettings,
  onQuickSync,
  isSyncing = false
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 px-4 py-3 sm:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-200 text-white">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent leading-none">
              마음감사
            </h1>
            <p className="text-xs text-amber-700/70 font-medium mt-0.5">
              개인 소유 100% 감사일기
            </p>
          </div>
        </div>

        {/* Right Stats & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100/80 border border-orange-200/60 text-orange-800 font-semibold text-xs sm:text-sm shadow-xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-400 animate-pulse" />
            <span>{streak.currentStreak}일 연속</span>
          </div>

          {/* Quick Sync Button */}
          {syncSettings.cloudProvider !== 'none' && onQuickSync && (
            <button
              onClick={onQuickSync}
              disabled={isSyncing}
              title={`${syncSettings.cloudProvider.toUpperCase()} 동기화`}
              className="p-2 rounded-xl bg-amber-100/70 hover:bg-amber-200/70 text-amber-800 transition-colors flex items-center gap-1.5 text-xs font-medium border border-amber-300/50"
            >
              <Cloud className="w-4 h-4 text-amber-700" />
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          )}

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-amber-800 transition-all border border-amber-200/80 shadow-xs hover:shadow-md"
            title="동기화 및 설정"
          >
            <Settings className="w-5 h-5" />
          </button>

        </div>

      </div>
    </header>
  );
};
