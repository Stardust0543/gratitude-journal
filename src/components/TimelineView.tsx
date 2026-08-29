import React, { useState } from 'react';
import { Search, Tag, Edit3, Trash2, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { JournalEntry, MoodScore } from '../types/journal';


interface TimelineViewProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

const MOOD_MAP: Record<MoodScore, { emoji: string; label: string; bg: string }> = {
  5: { emoji: '🥰', label: '행복', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  4: { emoji: '🙂', label: '기쁨', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  3: { emoji: '😐', label: '평범', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  2: { emoji: '🙁', label: '아쉬움', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  1: { emoji: '😢', label: '힘듦', bg: 'bg-purple-100 text-purple-800 border-purple-200' }
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  onEdit,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodScore | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Extract all unique tags across entries
  const allTags = Array.from(
    new Set(entries.flatMap(e => e.tags || []))
  );

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (selectedMood && entry.mood !== selectedMood) return false;
    if (selectedTag && (!entry.tags || !entry.tags.includes(selectedTag))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchItems = entry.items.some(i => i.toLowerCase().includes(q));
      const matchAffirmation = entry.affirmation?.toLowerCase().includes(q);
      const matchTags = entry.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchItems && !matchAffirmation && !matchTags) return false;
    }
    return true;
  });

  const handleDeleteConfirm = async (id: string, date: string) => {
    if (confirm(`${date} 날짜의 감사일기를 삭제하시겠습니까?`)) {
      await onDelete(id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-6 rounded-3xl border border-amber-200/70 shadow-sm space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-amber-700/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="감사한 일, 키워드, 태그 검색..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-amber-50/50 border border-amber-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-amber-800 bg-amber-200/60 px-2 py-1 rounded-xl"
            >
              지우기
            </button>
          )}
        </div>

        {/* Mood & Tag Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          
          {/* Mood Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 mr-1">기분:</span>
            <button
              onClick={() => setSelectedMood(null)}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                selectedMood === null
                  ? 'bg-amber-800 text-white font-bold'
                  : 'bg-amber-100/60 text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              전체
            </button>
            {([5, 4, 3, 2, 1] as MoodScore[]).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMood(selectedMood === m ? null : m)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 border ${
                  selectedMood === m
                    ? `${MOOD_MAP[m].bg} font-bold ring-2 ring-amber-400`
                    : 'bg-white border-amber-200/80 text-slate-700 hover:bg-amber-50'
                }`}
              >
                <span>{MOOD_MAP[m].emoji}</span>
                <span>{MOOD_MAP[m].label}</span>
              </button>
            ))}
          </div>

          {/* Tags Pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-600" /> 태그:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-lg ${
                  selectedTag === null
                    ? 'bg-amber-800 text-white font-bold'
                    : 'bg-amber-100/60 text-amber-900'
                }`}
              >
                전체
              </button>
              {allTags.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`px-2 py-0.5 rounded-lg border ${
                    selectedTag === t
                      ? 'bg-amber-300 border-amber-400 text-amber-950 font-bold'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Entries Feed */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-amber-200/50 p-8">
          <Heart className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">기록된 감사일기가 없습니다</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || selectedMood || selectedTag
              ? '검색 조건에 맞는 일기가 없습니다. 필터를 변경해 보세요.'
              : '오늘의 감사한 일 3가지를 작성하며 하루를 다뜻하게 채워보세요 💛'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(entry => {
            const moodInfo = MOOD_MAP[entry.mood || 5];
            const parsedDate = parseISO(entry.date);
            const dateDisplay = format(parsedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko });

            return (
              <div
                key={entry.id}
                className="bg-white/90 backdrop-blur-xs rounded-3xl p-6 border border-amber-200/70 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                {/* Header info */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{moodInfo.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-base">
                          {dateDisplay}
                        </h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${moodInfo.bg}`}>
                          {moodInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-100 transition-colors"
                      title="일기 수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(entry.id, entry.date)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="일기 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3 Items */}
                <ul className="space-y-2.5 mb-4">
                  {entry.items.map((item, idx) => (
                    item.trim() && (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    )
                  ))}
                </ul>

                {/* Affirmation */}
                {entry.affirmation && (
                  <div className="mb-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/50 text-xs text-amber-900 flex items-start gap-2">
                    <span className="shrink-0 font-bold">💬 긍정 확언:</span>
                    <span className="italic">{entry.affirmation}</span>
                  </div>
                )}

                {/* Photos */}
                {entry.photos && entry.photos.length > 0 && (
                  <div className="flex gap-2.5 mb-3 overflow-x-auto pb-1">
                    {entry.photos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="첨부 사진"
                        onClick={() => setPreviewImage(src)}
                        className="w-20 h-20 rounded-2xl object-cover border border-amber-200 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                      />
                    ))}
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {entry.tags.map((t, idx) => (
                      <span
                        key={idx}
                        onClick={() => setSelectedTag(t)}
                        className="text-xs text-amber-800 bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={previewImage}
            alt="크게 보기"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

    </div>
  );
};
