import { exportAllDataJSON, getAllJournalEntries, importDataJSON } from '../db/journalDb';
import { format } from 'date-fns';

export async function downloadJSONBackup() {
  const jsonStr = await exportAllDataJSON();
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `gratitude_journal_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadMarkdownBackup() {
  const entries = await getAllJournalEntries();
  const moodEmojiMap: Record<number, string> = {
    1: '😢 힘든 하루',
    2: '🙁 아쉬운 하루',
    3: '😐 평범한 하루',
    4: '🙂 소소한 하루',
    5: '🥰 행복한 하루'
  };

  let mdContent = `# 나의 감사일기 백업 (${format(new Date(), 'yyyy-MM-dd')})\n\n`;
  mdContent += `총 ${entries.length}개의 감사 기록이 저장되어 있습니다.\n\n---\n\n`;

  for (const entry of entries) {
    mdContent += `## 📅 ${entry.date} (${moodEmojiMap[entry.mood] || '감사일기'})\n\n`;
    if (entry.affirmation) {
      mdContent += `> 💬 **오늘의 긍정 확언**: ${entry.affirmation}\n\n`;
    }
    mdContent += `### ✨ 오늘 감사했던 일 3가지\n`;
    entry.items.forEach((item, idx) => {
      if (item.trim()) {
        mdContent += `${idx + 1}. ${item}\n`;
      }
    });

    if (entry.tags && entry.tags.length > 0) {
      mdContent += `\n🏷️ **태그**: ${entry.tags.map(t => `#${t}`).join(' ')}\n`;
    }

    mdContent += `\n---\n\n`;
  }

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `gratitude_journal_export_${format(new Date(), 'yyyy-MM-dd')}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function restoreFromFileFilePicker(): Promise<number> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            const count = await importDataJSON(content);
            resolve(count);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
        reader.readAsText(file);
      } else {
        reject(new Error('선택된 파일이 없습니다.'));
      }
    };

    input.click();
  });
}
