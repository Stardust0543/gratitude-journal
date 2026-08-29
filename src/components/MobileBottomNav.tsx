import React from 'react';
import { PenTool, Clock, Calendar, BarChart3 } from 'lucide-react';

export type TabType = 'today' | 'timeline' | 'calendar' | 'stats';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: '일기 작성', icon: <PenTool className="w-5 h-5" /> },
    { id: 'timeline', label: '타임라인', icon: <Clock className="w-5 h-5" /> },
    { id: 'calendar', label: '달력', icon: <Calendar className="w-5 h-5" /> },
    { id: 'stats', label: '통계/스트릭', icon: <BarChart3 className="w-5 h-5" /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/80 px-2 py-2 sm:hidden shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-amber-800 font-bold bg-amber-100/70 scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
