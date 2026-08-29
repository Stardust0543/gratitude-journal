import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Edit3 } from 'lucide-react';
import type { JournalEntry, MoodScore } from '../types/journal';


interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectDate: (dateStr: string) => void;
  onEditEntry: (entry: JournalEntry) => void;
}

const MOOD_EMOJIS: Record<MoodScore, string> = {
  5: '🥰',
  4: '🙂',
  3: '😐',
  2: '🙁',
  1: '😢'
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onSelectDate,
  onEditEntry
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Map entries by date string
  const entryMap = new Map<string, JournalEntry>();
  entries.forEach(e => entryMap.set(e.date, e));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = entryMap.get(dateStr);
    if (existing) {
      setSelectedEntry(existing);
    } else {
      onSelectDate(dateStr);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Calendar Card */}
      <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-6 border border-amber-200/70 shadow-sm">
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-bold transition-colors"
            >
              오늘
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-400">
          {weekDays.map((d, i) => (
            <div key={d} className={`py-1 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-amber-600' : ''}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = entryMap.get(dateStr);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonth
                    ? 'bg-slate-50/50 border-slate-100 text-slate-300'
                    : isDayToday
                    ? 'bg-amber-100/50 border-amber-400 text-amber-950 ring-2 ring-amber-300'
                    : entry
                    ? 'bg-amber-50/70 border-amber-200 text-slate-800 hover:bg-amber-100/70'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDayToday ? 'text-amber-900 font-extrabold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {entry && (
                    <span className="text-base sm:text-lg">
                      {MOOD_EMOJIS[entry.mood] || '✨'}
                    </span>
                  )}
                </div>

                {entry ? (
                  <div className="text-[10px] text-amber-900 line-clamp-1 bg-amber-200/50 px-1.5 py-0.5 rounded-md font-medium">
                    {entry.items[0]}
                  </div>
                ) : isCurrentMonth ? (
                  <div className="text-[10px] text-slate-300 hover:text-amber-600 flex items-center justify-center py-1">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Entry Modal */}
      {selectedEntry && (
        <div
          onClick={() => setSelectedEntry(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-amber-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{MOOD_EMOJIS[selectedEntry.mood]}</span>
                <h3 className="font-bold text-slate-800 text-lg">
                  {selectedEntry.date} 감사일기
                </h3>
              </div>
              <button
                onClick={() => {
                  const entryToEdit = selectedEntry;
                  setSelectedEntry(null);
                  onEditEntry(entryToEdit);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> 수정
              </button>
            </div>

            <ul className="space-y-2 text-sm text-slate-700">
              {selectedEntry.items.map((item, i) => (
                item.trim() && (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold text-amber-600">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                )
              ))}
            </ul>

            {selectedEntry.affirmation && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 italic">
                💬 {selectedEntry.affirmation}
              </div>
            )}

            <button
              onClick={() => setSelectedEntry(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors mt-2"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
