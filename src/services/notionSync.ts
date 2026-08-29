import type { JournalEntry } from '../types/journal';


export async function syncEntryToNotion(
  entry: JournalEntry,
  apiKey: string,
  databaseId: string
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !databaseId) {
    throw new Error('Notion API Key 및 Database ID가 설정되지 않았습니다.');
  }

  const moodEmojis: Record<number, string> = {
    1: '😢',
    2: '🙁',
    3: '😐',
    4: '🙂',
    5: '🥰'
  };

  const payload = {
    parent: { database_id: databaseId },
    icon: {
      type: 'emoji',
      emoji: moodEmojis[entry.mood] || '✨'
    },
    properties: {
      Title: {
        title: [
          {
            text: { content: `${entry.date} 감사일기` }
          }
        ]
      },
      Date: {
        date: { start: entry.date }
      },
      Mood: {
        number: entry.mood
      },
      Tags: {
        multi_select: (entry.tags || []).map(t => ({ name: t }))
      }
    },
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '✨ 오늘 감사했던 일 3가지' } }]
        }
      },
      ...entry.items.filter(i => i.trim()).map(item => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: item } }]
        }
      })),
      ...(entry.affirmation ? [
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [{ type: 'text', text: { content: `💬 긍정 확언: ${entry.affirmation}` } }],
            icon: { type: 'emoji', emoji: '💡' },
            color: 'yellow_background'
          }
        }
      ] : [])
    ]
  };

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Notion 페이지 생성 실패');
    }

    return { success: true, message: 'Notion 데이터베이스에 일기가 기록되었습니다!' };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Notion Sync 오류: ${errorMessage}`);
  }
}
