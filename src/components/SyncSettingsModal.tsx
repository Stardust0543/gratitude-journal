import React, { useState } from 'react';
import { X, ShieldCheck, Cloud, FileText, Download, Upload, Bell, Check, AlertCircle } from 'lucide-react';
import type { SyncSettings } from '../types/journal';

import { downloadJSONBackup, downloadMarkdownBackup, restoreFromFileFilePicker } from '../services/localBackup';
import { pushToGoogleDrive, pullFromGoogleDrive } from '../services/googleDriveSync';
import { syncEntryToNotion } from '../services/notionSync';
import { getAllJournalEntries } from '../db/journalDb';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  onSaveSettings: (newSettings: SyncSettings) => void;
  onDataImported: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataImported
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'gdrive' | 'notion' | 'local' | 'notification'>('privacy');
  
  // Form states
  const [gdriveToken, setGdriveToken] = useState(settings.gdriveAccessToken || '');
  const [notionKey, setNotionKey] = useState(settings.notionApiKey || '');
  const [notionDbId, setNotionDbId] = useState(settings.notionDatabaseId || '');
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (!isOpen) return null;

  const handleSaveDriveToken = () => {
    onSaveSettings({
      ...settings,
      cloudProvider: gdriveToken.trim() ? 'gdrive' : 'none',
      gdriveAccessToken: gdriveToken.trim()
    });
    setStatusMsg({ type: 'success', text: 'Google Drive 설정이 저장되었습니다!' });
  };

  const handleGoogleDrivePush = async () => {
    if (!gdriveToken.trim()) {
      setStatusMsg({ type: 'error', text: 'Google Access Token을 입력해 주세요.' });
      return;
    }
    setIsWorking(true);
    setStatusMsg({ type: 'info', text: 'Google Drive에 백업 파일 업로드 중...' });
    try {
      const res = await pushToGoogleDrive(gdriveToken.trim());
      setStatusMsg({ type: 'success', text: res.message });
      onSaveSettings({ ...settings, lastSyncedAt: new Date().toISOString() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: 'error', text: message });
    } finally {
      setIsWorking(false);
    }
  };

  const handleGoogleDrivePull = async () => {
    if (!gdriveToken.trim()) {
      setStatusMsg({ type: 'error', text: 'Google Access Token을 입력해 주세요.' });
      return;
    }
    setIsWorking(true);
    setStatusMsg({ type: 'info', text: 'Google Drive에서 데이터 동기화 중...' });
    try {
      const res = await pullFromGoogleDrive(gdriveToken.trim());
      setStatusMsg({ type: 'success', text: res.message });
      onDataImported();
      onSaveSettings({ ...settings, lastSyncedAt: new Date().toISOString() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: 'error', text: message });
    } finally {
      setIsWorking(false);
    }
  };

  const handleSaveNotionSettings = () => {
    onSaveSettings({
      ...settings,
      cloudProvider: notionKey.trim() && notionDbId.trim() ? 'notion' : 'none',
      notionApiKey: notionKey.trim(),
      notionDatabaseId: notionDbId.trim()
    });
    setStatusMsg({ type: 'success', text: 'Notion API 설정이 저장되었습니다!' });
  };

  const handleTestNotionSync = async () => {
    if (!notionKey.trim() || !notionDbId.trim()) {
      setStatusMsg({ type: 'error', text: 'Notion API Key와 Database ID를 모두 입력해 주세요.' });
      return;
    }
    setIsWorking(true);
    setStatusMsg({ type: 'info', text: 'Notion 데이터베이스로 동기화 테스트 진행 중...' });
    try {
      const entries = await getAllJournalEntries();
      if (entries.length === 0) {
        setStatusMsg({ type: 'error', text: '동기화할 감사일기가 최소 1개 이상 필요합니다.' });
        return;
      }
      const latest = entries[0];
      const res = await syncEntryToNotion(latest, notionKey.trim(), notionDbId.trim());
      setStatusMsg({ type: 'success', text: res.message });
      onSaveSettings({ ...settings, lastSyncedAt: new Date().toISOString() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: 'error', text: message });
    } finally {
      setIsWorking(false);
    }
  };

  const handleLocalRestore = async () => {
    try {
      const count = await restoreFromFileFilePicker();
      setStatusMsg({ type: 'success', text: `${count}개의 감사일기가 성공적으로 복원되었습니다!` });
      onDataImported();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: 'error', text: message });
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('마음감사 알림', {
        body: '매일 저녁 9시에 감사한 일을 돌아보는 알림을 보내드릴게요 💛'
      });
      setStatusMsg({ type: 'success', text: '알림 권한이 허용되었습니다!' });
    } else {
      setStatusMsg({ type: 'error', text: '알림 권한이 거부되었습니다.' });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full border border-amber-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-amber-50/80 p-5 border-b border-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>개인정보 & 개인 클라우드 동기화</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-200/50 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-100 bg-amber-50/30 overflow-x-auto text-xs font-semibold text-slate-600">
          <button
            onClick={() => { setActiveTab('privacy'); setStatusMsg(null); }}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'privacy' ? 'border-amber-500 text-amber-900 bg-white font-bold' : 'border-transparent hover:text-amber-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 개인정보 방침
          </button>
          <button
            onClick={() => { setActiveTab('gdrive'); setStatusMsg(null); }}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gdrive' ? 'border-amber-500 text-amber-900 bg-white font-bold' : 'border-transparent hover:text-amber-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> 구글 드라이브
          </button>
          <button
            onClick={() => { setActiveTab('notion'); setStatusMsg(null); }}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'notion' ? 'border-amber-500 text-amber-900 bg-white font-bold' : 'border-transparent hover:text-amber-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 노션 API
          </button>
          <button
            onClick={() => { setActiveTab('local'); setStatusMsg(null); }}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'local' ? 'border-amber-500 text-amber-900 bg-white font-bold' : 'border-transparent hover:text-amber-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> 로컬 백업/복원
          </button>
          <button
            onClick={() => { setActiveTab('notification'); setStatusMsg(null); }}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'notification' ? 'border-amber-500 text-amber-900 bg-white font-bold' : 'border-transparent hover:text-amber-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> 리마인더
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-slate-700">
          
          {/* Status Message Banner */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {statusMsg.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'info' && <Cloud className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  100% 제3자 서버 없는 안심 저장 방식
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  이 감사일기 앱은 개발자나 외부 업체의 별도 서버(Database)를 전혀 보유하지 않습니다.
                  모든 데이터는 오직 사용자의 브라우저 내부(IndexedDB)에만 우선 저장되며, 원할 경우 본인의 구글 드라이브나 노션 계정으로 직접 전송됩니다.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                <li><strong>PC ↔ 스마트폰 동기화</strong>: 구글 드라이브나 노션 연동을 설정하면 내 클라우드를 통해 두 기기가 자동으로 연동됩니다.</li>
                <li><strong>오프라인 지원</strong>: 인터넷 연결이 없어도 내 기기에 일기가 즉시 작성되고 수록됩니다.</li>
                <li><strong>내 데이터 소유권</strong>: 언제든지 JSON 백업 파일이나 마크다운(.md) 문서로 내 일기 전체를 다운로드할 수 있습니다.</li>
              </ul>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'gdrive' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                내 구글 계정의 구글 드라이브에 <code className="bg-amber-100 text-amber-900 px-1 rounded">gratitude_journal_backup.json</code> 파일로 안전하게 자동 저장합니다.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google OAuth Access Token
                </label>
                <input
                  type="password"
                  value={gdriveToken}
                  onChange={e => setGdriveToken(e.target.value)}
                  placeholder="ya29.a0..."
                  className="w-full px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 focus:bg-white text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  구글 OAuth 인가 토큰을 입력하시면 개발자 서버를 전혀 거치지 않고 브라우저가 직접 구글 드라이브 API를 호출합니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleSaveDriveToken}
                  className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900"
                >
                  토큰 저장
                </button>
                <button
                  onClick={handleGoogleDrivePush}
                  disabled={isWorking}
                  className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Drive로 업로드
                </button>
                <button
                  onClick={handleGoogleDrivePull}
                  disabled={isWorking}
                  className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Drive에서 가져오기
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: NOTION */}
          {activeTab === 'notion' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                사용자가 직접 노션(Notion) 커스텀 API 통합 토큰을 생성하여 노션 데이터베이스에 일기 페이지를 자동으로 기록합니다.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notion Integration API Key (secret_...)
                </label>
                <input
                  type="password"
                  value={notionKey}
                  onChange={e => setNotionKey(e.target.value)}
                  placeholder="secret_xxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notion Database ID
                </label>
                <input
                  type="text"
                  value={notionDbId}
                  onChange={e => setNotionDbId(e.target.value)}
                  placeholder="32자리 데이터베이스 ID"
                  className="w-full px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 focus:bg-white text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveNotionSettings}
                  className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900"
                >
                  설정 저장
                </button>
                <button
                  onClick={handleTestNotionSync}
                  disabled={isWorking}
                  className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Notion 동기화 테스트
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LOCAL BACKUP */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                내 컴퓨터나 스마트폰 파일 앱으로 감사일기 데이터를 백업하거나 복원합니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={downloadJSONBackup}
                  className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                    <Download className="w-4 h-4 text-amber-600" />
                    JSON 전체 데이터 백업
                  </div>
                  <p className="text-[11px] text-slate-500">
                    모든 감사일기와 사진이 포함된 JSON 파일 다운로드
                  </p>
                </button>

                <button
                  onClick={downloadMarkdownBackup}
                  className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Markdown 문서로 내보내기
                  </div>
                  <p className="text-[11px] text-slate-500">
                    읽기 쉬운 마크다운 문서(.md) 형태로 전체 일기 다운로드
                  </p>
                </button>
              </div>

              <div className="pt-3 border-t border-amber-100">
                <button
                  onClick={handleLocalRestore}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>백업 파일(JSON)로 데이터 복원하기</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATION */}
          {activeTab === 'notification' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  매일 감사일기 리마인더
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  매일 저녁 9시에 브라우저 푸시 알림을 통해 오늘 하루 감사했던 순간을 돌아보도록 안내합니다.
                </p>
              </div>

              <button
                onClick={requestNotificationPermission}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>브라우저 알림 권한 승인하기</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-amber-50/50 border-t border-amber-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
