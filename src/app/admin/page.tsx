'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiStatusResponse } from '@/types';
import { ApiLogEntry } from '@/lib/api-logger';

interface LogsResponse {
  logs: ApiLogEntry[];
  stats: {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
    endpointCounts: Record<string, number>;
    callerCounts: Record<string, number>;
  };
  count: number;
}

type ContentType = 'none' | 'duyuru' | 'reklam' | 'haber' | 'sponsor' | 'ozel';

interface AnnouncementData {
  html: string;
  contentType: ContentType;
  customTitle: string;
  showTitle: boolean;
  showBadge: boolean;
  updatedAt: string;
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'none', label: 'Başlık Yok' },
  { value: 'duyuru', label: 'Duyuru' },
  { value: 'reklam', label: 'Reklam' },
  { value: 'haber', label: 'Haber' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'ozel', label: 'Özel (Kendi Başlığınız)' },
];

export default function AdminPage() {
  const [status, setStatus] = useState<ApiStatusResponse | null>(null);
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Announcement state
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [announcementHtml, setAnnouncementHtml] = useState('');
  const [contentType, setContentType] = useState<ContentType>('none');
  const [customTitle, setCustomTitle] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch API status
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      // Fetch logs
      const logsRes = await fetch('/api/admin/logs');
      if (logsRes.ok) {
        const logsResponse = await logsRes.json();
        setLogsData(logsResponse);
      }
      
      // Fetch announcement
      const announcementRes = await fetch('/api/admin/announcement');
      if (announcementRes.ok) {
        const announcementData = await announcementRes.json();
        setAnnouncement(announcementData);
        setAnnouncementHtml(announcementData.html || '');
        setContentType(announcementData.contentType || 'none');
        setCustomTitle(announcementData.customTitle || '');
        setShowTitle(announcementData.showTitle || false);
        setShowBadge(announcementData.showBadge || false);
      }

      setError(null);
    } catch (err) {
      setError('Veriler yüklenirken bir hata oluştu');
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  const handleClearLogs = async () => {
    if (!confirm('Tüm logları silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };
  
  const handleSaveAnnouncement = async () => {
    setAnnouncementSaving(true);
    setAnnouncementSuccess(false);
    
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          html: announcementHtml,
          contentType,
          customTitle,
          showTitle,
          showBadge,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
        setAnnouncementSuccess(true);
        setTimeout(() => setAnnouncementSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving announcement:', err);
    } finally {
      setAnnouncementSaving(false);
    }
  };
  
  const handleResetAnnouncement = async () => {
    if (!confirm('Duyuru içeriğini varsayılana sıfırlamak istediğinizden emin misiniz?')) return;
    
    try {
      const res = await fetch('/api/admin/announcement', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
        setAnnouncementHtml(data.html || '');
        setContentType(data.contentType || 'none');
        setCustomTitle(data.customTitle || '');
        setShowTitle(data.showTitle || false);
        setShowBadge(data.showBadge || false);
      }
    } catch (err) {
      console.error('Error resetting announcement:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatEndDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getUsagePercentage = (): number => {
    if (!status?.requests) return 0;
    return (status.requests.current / status.requests.limit_day) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fb-yellow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-fb-yellow focus:ring-fb-yellow"
            />
            <span className="text-sm">Otomatik Yenile (5sn)</span>
          </label>
          <button
            onClick={fetchData}
            className="btn-ghost px-4 py-2 rounded-lg flex items-center gap-2 hover:text-fb-yellow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* API Status Card */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-fb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          API Durumu
        </h2>

        {status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Plan */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Plan</div>
              <div className="text-fb-yellow font-semibold text-lg">
                {status.subscription?.plan || 'N/A'}
              </div>
            </div>

            {/* Bitiş Tarihi */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Bitiş Tarihi</div>
              <div className="text-white font-semibold text-lg">
                {status.subscription?.end ? formatEndDate(status.subscription.end) : 'N/A'}
              </div>
            </div>

            {/* Aktif */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Durum</div>
              <div className={`font-semibold text-lg ${status.subscription?.active ? 'text-green-400' : 'text-red-400'}`}>
                {status.subscription?.active ? 'Aktif' : 'Pasif'}
              </div>
            </div>

            {/* Günlük Kullanım */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Günlük Kullanım</div>
              <div className="flex items-baseline gap-1">
                <span className={`font-semibold text-lg ${getUsageColor()}`}>
                  {status.requests?.current?.toLocaleString('tr-TR') || 0}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-400">
                  {status.requests?.limit_day?.toLocaleString('tr-TR') || 0}
                </span>
              </div>
            </div>

            {/* Yüzde */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Kullanım Oranı</div>
              <div className={`font-semibold text-lg ${getUsageColor()}`}>
                %{getUsagePercentage().toFixed(2)}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getUsagePercentage() >= 90 ? 'bg-red-500' :
                    getUsagePercentage() >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">API durumu alınamadı</div>
        )}
      </div>

      {/* Log Statistics */}
      {logsData?.stats && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-fb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Log İstatistikleri
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Toplam Çağrı</div>
              <div className="text-white font-semibold text-2xl">{logsData.stats.total}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Başarılı</div>
              <div className="text-green-400 font-semibold text-2xl">{logsData.stats.success}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Hatalı</div>
              <div className="text-red-400 font-semibold text-2xl">{logsData.stats.errors}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Ort. Yanıt Süresi</div>
              <div className="text-fb-yellow font-semibold text-2xl">
                {logsData.stats.avgResponseTime.toFixed(0)}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Editor */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-fb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          İçerik Yönetimi
        </h2>
        
        {/* Content Type and Display Options */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Content Type Selector */}
            <div>
              <label className="text-gray-400 text-sm block mb-2">İçerik Türü</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fb-yellow"
              >
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Custom Title Input (only shown when contentType is 'ozel') */}
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                Özel Başlık {contentType !== 'ozel' && <span className="text-gray-600">(Özel türü seçin)</span>}
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                disabled={contentType !== 'ozel'}
                placeholder="Başlık yazın..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fb-yellow disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            {/* Show Title Checkbox */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-fb-yellow focus:ring-fb-yellow focus:ring-offset-slate-900"
                />
                <div>
                  <span className="text-white text-sm">Başlık Göster</span>
                  <p className="text-gray-500 text-xs">Sol üstte başlık görünür</p>
                </div>
              </label>
            </div>
            
            {/* Show Badge Checkbox */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) => setShowBadge(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-fb-yellow focus:ring-fb-yellow focus:ring-offset-slate-900"
                />
                <div>
                  <span className="text-white text-sm">Etiket Göster</span>
                  <p className="text-gray-500 text-xs">Sağ üstte etiket görünür</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HTML Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-400 text-sm">HTML İçerik</label>
              <span className="text-xs text-gray-500">
                Son güncelleme: {announcement?.updatedAt ? formatDateTime(announcement.updatedAt) : 'Yok'}
              </span>
            </div>
            <textarea
              value={announcementHtml}
              onChange={(e) => setAnnouncementHtml(e.target.value)}
              className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-4 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:border-fb-yellow"
              placeholder="<div class='text-center'>&#10;  <h3 class='text-white font-bold'>Başlık</h3>&#10;  <p class='text-gray-400'>İçerik...</p>&#10;</div>"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveAnnouncement}
                disabled={announcementSaving}
                className="flex-1 bg-fb-yellow text-fb-navy font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {announcementSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kaydet
                  </>
                )}
              </button>
              <button
                onClick={handleResetAnnouncement}
                className="px-4 py-2 border border-slate-600 text-gray-400 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors"
              >
                Sıfırla
              </button>
            </div>
            {announcementSuccess && (
              <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                İçerik başarıyla kaydedildi!
              </div>
            )}
          </div>
          
          {/* Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-400 text-sm">Canlı Önizleme</label>
              <span className="text-xs text-gray-500">Anasayfadaki görünüm</span>
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 h-64 overflow-auto">
              {/* Dynamic Header based on settings */}
              {(showTitle || showBadge) && (
                <div className="flex items-center justify-between mb-4">
                  {showTitle && contentType !== 'none' && (
                    <h3 className="text-lg font-bold text-white">
                      {contentType === 'ozel' && customTitle 
                        ? customTitle.toUpperCase() 
                        : CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.label.toUpperCase()}
                    </h3>
                  )}
                  {!showTitle && <div />}
                  {showBadge && contentType !== 'none' && (
                    <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                      {contentType === 'ozel' && customTitle 
                        ? customTitle 
                        : CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.label}
                    </span>
                  )}
                </div>
              )}
              <div 
                className={`flex items-center justify-center ${(showTitle || showBadge) ? 'h-[calc(100%-40px)]' : 'h-full'}`}
                dangerouslySetInnerHTML={{ __html: announcementHtml }}
              />
            </div>
            
            {/* Usage Tips */}
            <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="text-sm text-blue-300">
                <strong className="flex items-center gap-1 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Kullanım İpuçları:
                </strong>
                <ul className="text-xs text-blue-300/80 ml-5 list-disc space-y-1">
                  <li>Tailwind CSS class&apos;larını kullanabilirsiniz (text-white, bg-yellow-500, vb.)</li>
                  <li>Görsel eklemek için: <code className="bg-blue-900/50 px-1 rounded">&lt;img src=&quot;...&quot; class=&quot;w-full rounded&quot; /&gt;</code></li>
                  <li>Link eklemek için: <code className="bg-blue-900/50 px-1 rounded">&lt;a href=&quot;...&quot; class=&quot;text-fb-yellow&quot;&gt;...&lt;/a&gt;</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Logs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-fb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            API Çağrıları
            <span className="text-sm text-gray-400 font-normal">
              (Son {logsData?.count || 0} / 200)
            </span>
          </h2>
          <button
            onClick={handleClearLogs}
            className="btn-ghost px-4 py-2 rounded-lg text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Logları Temizle
          </button>
        </div>

        {logsData?.logs && logsData.logs.length > 0 ? (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logsData.logs.map((log) => (
              <div
                key={log.id}
                className={`bg-slate-800/50 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-800 ${
                  selectedLog?.id === log.id ? 'ring-2 ring-fb-yellow' : ''
                }`}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Badge */}
                    <span className={`text-sm font-mono font-semibold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>

                    {/* Endpoint */}
                    <span className="text-white font-mono text-sm truncate">
                      {log.endpoint}
                    </span>

                    {/* Parameters - Now shown on front face */}
                    {Object.keys(log.params).length > 0 && (
                      <span className="text-green-400 font-mono text-xs bg-slate-900/80 px-2 py-1 rounded truncate hidden sm:block max-w-[300px]">
                        {Object.entries(log.params).map(([k, v]) => `${k}=${v}`).join(', ')}
                      </span>
                    )}

                    {/* Caller Page */}
                    <span className="text-gray-500 text-sm truncate hidden lg:block">
                      {log.callerPage}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Response Time */}
                    <span className="text-gray-400 text-sm">
                      {log.responseTime}ms
                    </span>

                    {/* Date/Time */}
                    <span className="text-gray-500 text-sm hidden lg:block">
                      {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                    </span>

                    {/* Expand Icon */}
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        selectedLog?.id === log.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Mobile: Show params below */}
                {Object.keys(log.params).length > 0 && (
                  <div className="sm:hidden mt-2">
                    <span className="text-green-400 font-mono text-xs bg-slate-900/80 px-2 py-1 rounded inline-block">
                      {Object.entries(log.params).map(([k, v]) => `${k}=${v}`).join(', ')}
                    </span>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedLog?.id === log.id && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                    {/* Call Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Çağıran Sayfa</div>
                        <div className="text-white text-sm font-mono bg-slate-900 px-3 py-2 rounded">
                          {log.callerPage}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Tarih & Saat</div>
                        <div className="text-white text-sm font-mono bg-slate-900 px-3 py-2 rounded">
                          {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Parameters - Also in detail for full view */}
                    {Object.keys(log.params).length > 0 && (
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Parametreler</div>
                        <div className="bg-slate-900 rounded p-3 font-mono text-sm text-green-400">
                          {JSON.stringify(log.params, null, 2)}
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {log.error && (
                      <div>
                        <div className="text-red-400 text-xs mb-1">Hata</div>
                        <div className="bg-red-900/30 border border-red-500/30 rounded p-3 font-mono text-sm text-red-300">
                          {log.error}
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs">Yanıt</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(JSON.stringify(log.response, null, 2));
                          }}
                          className="text-xs text-gray-500 hover:text-fb-yellow"
                        >
                          Kopyala
                        </button>
                      </div>
                      <div className="bg-slate-900 rounded p-3 font-mono text-xs text-gray-300 max-h-[300px] overflow-auto">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Used Fields Hint */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-300">
                          <strong>Kullanılan Alanlar:</strong> Bu çağrıdan alınan veriler, çağıran sayfa ({log.callerPage}) tarafından 
                          UI oluşturmak için işlenmektedir. Genellikle <code className="bg-blue-900/50 px-1 rounded">response</code> içindeki 
                          takım, oyuncu ve maç bilgileri kullanılır.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">Henüz API çağrısı yapılmadı</p>
            <p className="text-gray-600 text-sm mt-1">Site içinde gezinerek API çağrıları oluşturabilirsiniz</p>
          </div>
        )}
      </div>
    </div>
  );
}
