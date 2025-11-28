import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FixtureStatus, FixtureEvent } from '@/types';
import { TRANSLATIONS, LIVE_STATUSES, FINISHED_STATUSES, FENERBAHCE_TEAM_ID } from '../constants';

// =============================================
// DATE UTILITIES
// =============================================

/**
 * Tarih formatla - Türkçe
 */
export function formatDate(dateString: string, formatStr: string = 'd MMMM yyyy'): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr, { locale: tr });
  } catch {
    return dateString;
  }
}

/**
 * Saat formatla
 */
export function formatTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'HH:mm', { locale: tr });
  } catch {
    return '--:--';
  }
}

/**
 * Kısa tarih formatı (bugün, yarın, dün veya tarih)
 */
export function formatShortDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) return 'Bugün';
    if (isTomorrow(date)) return 'Yarın';
    if (isYesterday(date)) return 'Dün';
    
    return format(date, 'd MMM', { locale: tr });
  } catch {
    return dateString;
  }
}

/**
 * Relatif tarih (2 saat önce, 3 gün sonra vb.)
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  } catch {
    return dateString;
  }
}

/**
 * Maç günü ve saati formatı
 */
export function formatMatchDateTime(dateString: string): { date: string; time: string; full: string } {
  try {
    const date = parseISO(dateString);
    return {
      date: formatShortDate(dateString),
      time: format(date, 'HH:mm', { locale: tr }),
      full: format(date, 'd MMMM yyyy, HH:mm', { locale: tr }),
    };
  } catch {
    return { date: '--', time: '--:--', full: dateString };
  }
}

// =============================================
// STATUS UTILITIES
// =============================================

/**
 * Maç durumu Türkçe çevirisi
 */
export function getStatusText(status: FixtureStatus, elapsed?: number | null): string {
  const translation = TRANSLATIONS.status[status];
  
  if (LIVE_STATUSES.includes(status as typeof LIVE_STATUSES[number]) && elapsed) {
    if (status === 'HT') return 'Devre Arası';
    return `${elapsed}'`;
  }
  
  return translation || status;
}

/**
 * Maç durumu canlı mı kontrolü
 */
export function isLive(status: FixtureStatus): boolean {
  return LIVE_STATUSES.includes(status as typeof LIVE_STATUSES[number]);
}

/**
 * Maç bitti mi kontrolü
 */
export function isFinished(status: FixtureStatus): boolean {
  return FINISHED_STATUSES.includes(status as typeof FINISHED_STATUSES[number]);
}

/**
 * Maç başlamadı mı kontrolü
 */
export function isScheduled(status: FixtureStatus): boolean {
  return ['TBD', 'NS'].includes(status);
}

// =============================================
// EVENT UTILITIES
// =============================================

/**
 * Olay türü Türkçe çevirisi
 */
export function getEventText(type: string, detail?: string): string {
  if (detail && TRANSLATIONS.events[detail as keyof typeof TRANSLATIONS.events]) {
    return TRANSLATIONS.events[detail as keyof typeof TRANSLATIONS.events];
  }
  return TRANSLATIONS.events[type as keyof typeof TRANSLATIONS.events] || type;
}

/**
 * Olay için emoji/icon
 */
export function getEventEmoji(type: string, detail?: string): string {
  switch (type) {
    case 'Goal':
      if (detail === 'Own Goal') return '⚽🔴';
      if (detail === 'Penalty') return '⚽🎯';
      if (detail === 'Missed Penalty') return '❌🎯';
      return '⚽';
    case 'Card':
      if (detail === 'Yellow Card') return '🟨';
      if (detail === 'Red Card') return '🟥';
      if (detail === 'Second Yellow card') return '🟨🟥';
      return '🟨';
    case 'subst':
      return '🔄';
    case 'Var':
      return '📺';
    default:
      return '•';
  }
}

/**
 * Goller listesini formatla
 */
export function formatGoalScorers(events: FixtureEvent[], teamId: number): string {
  const goals = events.filter(
    e => e.type === 'Goal' && e.team.id === teamId && e.detail !== 'Missed Penalty'
  );
  
  if (goals.length === 0) return '';
  
  const scorerMap = new Map<string, number[]>();
  
  goals.forEach(goal => {
    const name = goal.player.name.split(' ').pop() || goal.player.name;
    const minutes = scorerMap.get(name) || [];
    minutes.push(goal.time.elapsed + (goal.time.extra || 0));
    scorerMap.set(name, minutes);
  });
  
  return Array.from(scorerMap.entries())
    .map(([name, minutes]) => `${name} ${minutes.map(m => `${m}'`).join(', ')}`)
    .join(', ');
}

// =============================================
// STRING UTILITIES
// =============================================

/**
 * İsmi kısalt (Edin Dzeko -> E. Dzeko)
 */
export function shortenName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return fullName;
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return `${firstName.charAt(0)}. ${lastName}`;
}

/**
 * İsmin sadece soyadını al
 */
export function getLastName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
}

/**
 * Pozisyon kısaltmasını tam haline çevir
 */
export function getPositionFull(position: string): string {
  return TRANSLATIONS.positions[position as keyof typeof TRANSLATIONS.positions] || position;
}

// =============================================
// NUMBER UTILITIES
// =============================================

/**
 * Sayıyı K/M formatında göster
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Yüzdeyi formatla
 */
export function formatPercentage(value: number | string | null): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${Math.round(num)}%`;
}

/**
 * Rating'i formatla
 */
export function formatRating(rating: string | number | null): string {
  if (!rating) return '-';
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  return num.toFixed(1);
}

// =============================================
// TEAM UTILITIES
// =============================================

/**
 * Fenerbahçe maçı mı kontrolü
 */
export function isFenerbahceMatch(homeId: number, awayId: number): boolean {
  return homeId === FENERBAHCE_TEAM_ID || awayId === FENERBAHCE_TEAM_ID;
}

/**
 * Fenerbahçe ev sahibi mi kontrolü
 */
export function isFenerbahceHome(homeId: number): boolean {
  return homeId === FENERBAHCE_TEAM_ID;
}

/**
 * Maç sonucunu belirle (Fenerbahçe perspektifinden)
 */
export function getFenerbahceResult(
  homeId: number,
  homeScore: number | null,
  awayScore: number | null
): 'W' | 'D' | 'L' | null {
  if (homeScore === null || awayScore === null) return null;
  
  const isFBHome = homeId === FENERBAHCE_TEAM_ID;
  const fbScore = isFBHome ? homeScore : awayScore;
  const opponentScore = isFBHome ? awayScore : homeScore;
  
  if (fbScore > opponentScore) return 'W';
  if (fbScore < opponentScore) return 'L';
  return 'D';
}

// =============================================
// FORM UTILITIES
// =============================================

/**
 * Form string'ini parse et
 */
export function parseForm(form: string | null): ('W' | 'D' | 'L')[] {
  if (!form) return [];
  return form.split('').filter(c => ['W', 'D', 'L'].includes(c)) as ('W' | 'D' | 'L')[];
}

/**
 * Form'u hesapla (son N maç)
 */
export function calculateFormPoints(form: ('W' | 'D' | 'L')[]): number {
  return form.reduce((total, result) => {
    if (result === 'W') return total + 3;
    if (result === 'D') return total + 1;
    return total;
  }, 0);
}

// =============================================
// URL UTILITIES
// =============================================

/**
 * Lig adını URL-friendly yap
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * API logosu için proxy URL
 */
export function getLogoUrl(url: string): string {
  // API-Sports logoları direkt kullanılabilir
  return url;
}

// =============================================
// STATISTICS UTILITIES
// =============================================

/**
 * İstatistik değerini parse et
 */
export function parseStatValue(value: string | number | null): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  // Yüzde değerleri
  const percentMatch = value.match(/^(\d+)%$/);
  if (percentMatch) return parseInt(percentMatch[1], 10);
  
  return parseInt(value, 10) || 0;
}

/**
 * İstatistik adını Türkçeleştir
 */
export function translateStatName(statType: string): string {
  return TRANSLATIONS.stats[statType as keyof typeof TRANSLATIONS.stats] || statType;
}

// =============================================
// CN (className helper)
// =============================================

/**
 * Conditional className birleştirici
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
