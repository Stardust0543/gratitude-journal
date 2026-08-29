import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, X, Tag, Calendar as CalendarIcon, CheckCircle2, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { JournalEntry, MoodOption, MoodScore } from '../types/journal';


interface TodayEntryFormProps {
  initialEntry?: JournalEntry;
  onSave: (entry: Omit<JournalEntry, 'createdAt' | 'updatedAt'>) => Promise<void>;
  selectedDateStr?: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { score: 5, emoji: '🥰', label: '최고의 하루', color: 'bg-rose-100 border-rose-300 text-rose-800' },
  { score: 4, emoji: '🙂', label: '기분 좋은 하루', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { score: 3, emoji: '😐', label: '평범한 하루', color: 'bg-slate-100 border-slate-300 text-slate-800' },
  { score: 2, emoji: '🙁', label: '아쉬운 하루', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { score: 1, emoji: '😢', label: '힘든 하루', color: 'bg-purple-100 border-purple-300 text-purple-800' }
];

const ITEM_PLACEHOLDERS = [
  '오늘 나를 미소 짓게 한 순간이나 맛있는 소소한 식사',
  '고마웠던 사람, 다정한 대화 또는 안부 연락',
  '오늘 이뤄낸 작고 소중한 성취나 스스로에게 고마운 점'
];

export const TodayEntryForm: React.FC<TodayEntryFormProps> = ({
  initialEntry,
  onSave,
  selectedDateStr = format(new Date(), 'yyyy-MM-dd')
}) => {
  const [date, setDate] = useState<string>(selectedDateStr);
  const [items, setItems] = useState<string[]>(['', '', '']);
  const [affirmation, setAffirmation] = useState<string>('');
  const [mood, setMood] = useState<MoodScore>(5);
  const [photos, setPhotos] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialEntry) {
      setDate(initialEntry.date);
      setItems([
        initialEntry.items[0] || '',
        initialEntry.items[1] || '',
        initialEntry.items[2] || ''
      ]);
      setAffirmation(initialEntry.affirmation || '');
      setMood(initialEntry.mood || 5);
      setPhotos(initialEntry.photos || []);
      setTags(initialEntry.tags || []);
    } else {
      setDate(selectedDateStr);
      setItems(['', '', '']);
      setAffirmation('');
      setMood(5);
      setPhotos([]);
      setTags([]);
    }
  }, [initialEntry, selectedDateStr]);

  const handleItemChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index] = val;
    setItems(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('사진 크기는 5MB 이하만 가능합니다.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setPhotos(prev => [...prev, evt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags(prev => [...prev, cleaned]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.some(i => i.trim().length > 0)) {
      alert('최소 한 가지 이상의 감사 내용을 작성해 주세요! 💛');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: date,
        date,
        items,
        affirmation,
        mood,
        photos,
        tags
      });

      // Celebration effect
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#f43f5e', '#10b981']
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDisplayDate = format(new Date(date), 'yyyy년 M월 d일 (EEEE)', { locale: ko });

  return (
    <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/5 border border-amber-200/70 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-amber-100">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>오늘 하루 돌아보기</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            {formattedDisplayDate}
          </h2>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 text-xs font-medium text-amber-900">
          <CalendarIcon className="w-4 h-4 text-amber-600" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer font-medium"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Mood Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            오늘의 마음 상태 (기분)
          </label>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {MOOD_OPTIONS.map(opt => (
              <button
                key={opt.score}
                type="button"
                onClick={() => setMood(opt.score)}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl transition-all border ${
                  mood === opt.score
                    ? `${opt.color} ring-2 ring-amber-400 scale-105 shadow-md font-bold`
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50/50'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1">{opt.emoji}</span>
                <span className="text-xs hidden sm:block">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 Gratitude Items */}
        <div className="space-y-3.5">
          <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
              3
            </span>
            오늘 감사했던 일 3가지
          </label>
          
          {items.map((item, idx) => (
            <div key={idx} className="relative flex items-center">
              <span className="absolute left-3.5 font-bold text-amber-600/80 text-sm">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={item}
                onChange={e => handleItemChange(idx, e.target.value)}
                placeholder={ITEM_PLACEHOLDERS[idx]}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-amber-50/40 border border-amber-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/80 text-slate-800 placeholder-slate-400 text-sm transition-all shadow-xs"
              />
            </div>
          ))}
        </div>

        {/* Daily Affirmation */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            💬 오늘의 긍정 확언 (나에게 해주고 싶은 말)
          </label>
          <input
            type="text"
            value={affirmation}
            onChange={e => setAffirmation(e.target.value)}
            placeholder="예: 나는 충분히 잘해내고 있고, 내일도 행복할 자격이 있어."
            className="w-full px-4 py-3 rounded-2xl bg-amber-50/40 border border-amber-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/80 text-slate-800 placeholder-slate-400 text-sm transition-all"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            태그 (엔터 키로 추가)
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-amber-50/30 border border-amber-200/60 min-h-[46px]">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-200/70 text-amber-900 text-xs font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-rose-700 text-amber-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={tags.length === 0 ? "태그 입력 (예: 일상, 소풍, 성공)" : ""}
              className="flex-1 bg-transparent focus:outline-none text-xs text-slate-800 placeholder-slate-400 min-w-[120px]"
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-amber-600" />
            오늘의 감사한 사진 (선택)
          </label>
          <div className="flex flex-wrap gap-3">
            {photos.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-amber-200 shadow-xs group">
                <img src={src} alt="감사 사진" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {photos.length < 3 && (
              <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/50 flex flex-col items-center justify-center text-amber-700 cursor-pointer transition-colors">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">추가</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
        >
          {isSaving ? (
            <span>저장 중...</span>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-amber-100" />
              <span>저장 완료! ✨</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>감사일기 기록하기</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
};
