import React from 'react';
import { Flame, Trophy, BookOpen, Quote, Sparkles } from 'lucide-react';
import type { StreakStats as StreakStatsType, JournalEntry } from '../types/journal';


interface StreakStatsProps {
  stats: StreakStatsType;
  entries: JournalEntry[];
}

const INSPIRATIONAL_QUOTES = [
  "감사는 과거에 의미를 부여하고, 오늘에 평화를 가져다주며, 내일을 위한 비전을 창조한다.",
  "작은 것에 감사하는 마음이 더 큰 행복을 불러온다.",
  "오늘 하루의 작은 다정함이 누군가에겐 평생 잊지 못할 빛이 된다.",
  "감사할 줄 아는 사람은 결코 가난하지 않다.",
  "행복은 우리가 가진 것들에 감사하는 순간 시작된다."
];

export const StreakStatsComponent: React.FC<StreakStatsProps> = ({ stats, entries }) => {
  // Pick random quote based on date or entries length
  const quoteIndex = (entries.length + new Date().getDate()) % INSPIRATIONAL_QUOTES.length;
  const quote = INSPIRATIONAL_QUOTES[quoteIndex];

  // Calculate mood counts
  const moodCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach(e => {
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Inspiring Daily Quote */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
        <Quote className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
        <div className="flex items-center gap-2 text-amber-100 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>오늘의 감사 명언</span>
        </div>
        <p className="text-lg sm:text-xl font-medium leading-relaxed italic">
          "{quote}"
        </p>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Current Streak */}
        <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-5 border border-amber-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-orange-500 animate-bounce" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">현재 연속 기록</span>
            <h3 className="text-2xl font-black text-slate-800">
              {stats.currentStreak}<span className="text-sm font-normal text-slate-600 ml-1">일</span>
            </h3>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-5 border border-amber-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">최장 연속 기록</span>
            <h3 className="text-2xl font-black text-slate-800">
              {stats.longestStreak}<span className="text-sm font-normal text-slate-600 ml-1">일</span>
            </h3>
          </div>
        </div>

        {/* Total Entries */}
        <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-5 border border-amber-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">총 감사 기록</span>
            <h3 className="text-2xl font-black text-slate-800">
              {stats.totalEntries}<span className="text-sm font-normal text-slate-600 ml-1">개</span>
            </h3>
          </div>
        </div>

      </div>

      {/* Mood Distribution Card */}
      <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-6 border border-amber-200/70 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          📊 나의 마음 상태 리포트
        </h3>

        {entries.length === 0 ? (
          <p className="text-xs text-slate-400">아직 일기가 없습니다. 일기를 작성해 보세요!</p>
        ) : (
          <div className="space-y-3">
            {[
              { score: 5, emoji: '🥰', label: '행복함', color: 'bg-rose-400' },
              { score: 4, emoji: '🙂', label: '기분 좋음', color: 'bg-amber-400' },
              { score: 3, emoji: '😐', label: '평범함', color: 'bg-slate-400' },
              { score: 2, emoji: '🙁', label: '아쉬움', color: 'bg-blue-400' },
              { score: 1, emoji: '😢', label: '힘듦', color: 'bg-purple-400' }
            ].map(m => {
              const count = moodCounts[m.score] || 0;
              const percent = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;

              return (
                <div key={m.score} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </span>
                    <span>{count}회 ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
