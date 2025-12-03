// Announcement Content Storage
// Simple in-memory storage for announcement content

export type ContentType = 'none' | 'duyuru' | 'reklam' | 'haber' | 'sponsor' | 'ozel';

export interface AnnouncementData {
  html: string;
  contentType: ContentType;
  customTitle: string; // Custom title when contentType is 'ozel'
  showTitle: boolean;
  showBadge: boolean;
  updatedAt: string;
}

// Content type labels in Turkish
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  none: 'Başlık Yok',
  duyuru: 'Duyuru',
  reklam: 'Reklam',
  haber: 'Haber',
  sponsor: 'Sponsor',
  ozel: 'Özel',
};

// Default announcement content
const defaultAnnouncement: AnnouncementData = {
  html: `
    <div class="text-center">
      <div class="text-yellow-400 text-4xl mb-3">📢</div>
      <h3 class="text-white font-bold text-lg mb-2">İçerik Alanı</h3>
      <p class="text-slate-400 text-sm">
        Bu alana reklam, duyuru veya özel içerik ekleyebilirsiniz.
      </p>
      <p class="text-slate-500 text-xs mt-3">
        Admin panelinden düzenleyin
      </p>
    </div>
  `,
  contentType: 'none',
  customTitle: '',
  showTitle: false,
  showBadge: false,
  updatedAt: new Date().toISOString(),
};

// In-memory storage (will reset on server restart)
// In production, this should be stored in a database
let announcementData: AnnouncementData = { ...defaultAnnouncement };

export function getAnnouncement(): AnnouncementData {
  return announcementData;
}

export function setAnnouncement(data: Partial<AnnouncementData>): AnnouncementData {
  announcementData = {
    ...announcementData,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return announcementData;
}

export function resetAnnouncement(): AnnouncementData {
  announcementData = { ...defaultAnnouncement };
  return announcementData;
}
