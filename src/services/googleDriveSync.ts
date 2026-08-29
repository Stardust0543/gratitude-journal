import { exportAllDataJSON, importDataJSON } from '../db/journalDb';

const BACKUP_FILENAME = 'gratitude_journal_backup.json';

export async function findDriveBackupFile(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Google Drive 파일 검색 실패');
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

export async function pushToGoogleDrive(accessToken: string): Promise<{ success: boolean; fileId: string; message: string }> {
  const jsonContent = await exportAllDataJSON();
  const fileId = await findDriveBackupFile(accessToken);

  if (fileId) {
    // Update existing file
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: jsonContent
    });

    if (!res.ok) {
      throw new Error('Google Drive 기존 백업 업데이트에 실패했습니다.');
    }

    return { success: true, fileId, message: 'Google Drive 백업 업데이트 완료!' };
  } else {
    // Create new file
    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([jsonContent], { type: 'application/json' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    });

    if (!res.ok) {
      throw new Error('Google Drive 새 백업 파일 생성에 실패했습니다.');
    }

    const data = await res.json();
    return { success: true, fileId: data.id, message: 'Google Drive 백업 파일이 성공적으로 생성되었습니다!' };
  }
}

export async function pullFromGoogleDrive(accessToken: string): Promise<{ importedCount: number; message: string }> {
  const fileId = await findDriveBackupFile(accessToken);
  if (!fileId) {
    return { importedCount: 0, message: 'Google Drive에서 감사일기 백업 파일을 찾을 수 없습니다.' };
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new Error('Google Drive에서 데이터 다운로드 실패');
  }

  const jsonText = await res.text();
  const count = await importDataJSON(jsonText);
  return { importedCount: count, message: `${count}개의 감사일기 항목을 Google Drive에서 동기화했습니다.` };
}
