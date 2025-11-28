// =============================================
// FENERBAHÇE KRİTİK ID'LER
// =============================================

export const FENERBAHCE_TEAM_ID = 611;

export const TRACKED_LEAGUES = {
  SUPER_LIG: 203,
  TURKIYE_KUPASI: 206,
  UEFA_CHAMPIONS_LEAGUE: 2,
  UEFA_EUROPA_LEAGUE: 3,
  UEFA_CONFERENCE_LEAGUE: 848,
} as const;

export const TRACKED_LEAGUE_IDS: number[] = Object.values(TRACKED_LEAGUES);

// Dinamik sezon hesaplama - Ağustos'tan itibaren yeni sezon
const getCurrentSeason = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, 7 = Ağustos
  return month >= 7 ? year : year - 1;
};

export const CURRENT_SEASON = getCurrentSeason();

// =============================================
// CACHE TTL (saniye cinsinden)
// =============================================

export const CACHE_TTL = {
  LIVESCORE: 15,              // Canlı maç: 15 saniye
  TODAY_FIXTURES: 300,        // Günün maçları: 5 dakika
  STANDINGS: 3600,            // Puan durumu: 1 saat
  TEAM_INFO: 86400,           // Takım bilgisi: 1 gün
  PLAYER_INFO: 86400,         // Oyuncu bilgisi: 1 gün
  COMPLETED_MATCH: 604800,    // Tamamlanan maç: 1 hafta
  HISTORICAL_DATA: 2592000,   // Geçmiş veri: 30 gün
  SQUAD: 86400,               // Kadro: 1 gün
  TOP_SCORERS: 3600,          // Gol krallığı: 1 saat
} as const;

// =============================================
// API KONFIGÜRASYONU
// =============================================

export const API_CONFIG = {
  BASE_URL: 'https://v3.football.api-sports.io',
  DAILY_LIMIT: 75000,
  HEADERS: {
    'x-rapidapi-host': 'v3.football.api-sports.io',
  },
} as const;

// =============================================
// MAÇ DURUM KODLARI
// =============================================

export const FIXTURE_STATUS = {
  // Planlanmış
  TBD: 'TBD',   // Time To Be Defined
  NS: 'NS',     // Not Started
  
  // Devam Eden
  LIVE: 'LIVE', // Live (In Progress)
  '1H': '1H',   // First Half
  HT: 'HT',     // Halftime
  '2H': '2H',   // Second Half
  ET: 'ET',     // Extra Time
  BT: 'BT',     // Break Time (Extra time)
  P: 'P',       // Penalty In Progress
  
  // Askıya Alınmış
  SUSP: 'SUSP', // Suspended
  INT: 'INT',   // Interrupted
  
  // Tamamlanmış
  FT: 'FT',     // Full Time
  AET: 'AET',   // After Extra Time
  PEN: 'PEN',   // After Penalty
  
  // İptal/Erteleme
  PST: 'PST',   // Postponed
  CANC: 'CANC', // Cancelled
  ABD: 'ABD',   // Abandoned
  AWD: 'AWD',   // Technical Loss
  WO: 'WO',     // WalkOver
} as const;

export const LIVE_STATUSES = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P'] as const;
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN'] as const;
export const SCHEDULED_STATUSES = ['TBD', 'NS'] as const;

// =============================================
// TÜRKÇE ÇEVİRİLER
// =============================================

export const TRANSLATIONS = {
  leagues: {
    [TRACKED_LEAGUES.SUPER_LIG]: 'Süper Lig',
    [TRACKED_LEAGUES.TURKIYE_KUPASI]: 'Türkiye Kupası',
    [TRACKED_LEAGUES.UEFA_CHAMPIONS_LEAGUE]: 'Şampiyonlar Ligi',
    [TRACKED_LEAGUES.UEFA_EUROPA_LEAGUE]: 'UEFA Avrupa Ligi',
    [TRACKED_LEAGUES.UEFA_CONFERENCE_LEAGUE]: 'Konferans Ligi',
  },
  status: {
    TBD: 'Belirlenmedi',
    NS: 'Başlamadı',
    LIVE: 'Canlı',
    '1H': '1. Yarı',
    HT: 'Devre Arası',
    '2H': '2. Yarı',
    ET: 'Uzatma',
    BT: 'Uzatma Arası',
    P: 'Penaltılar',
    SUSP: 'Askıda',
    INT: 'Kesintide',
    FT: 'Bitti',
    AET: 'Uzatma Sonrası',
    PEN: 'Penaltı Sonrası',
    PST: 'Ertelendi',
    CANC: 'İptal',
    ABD: 'Yarıda Kaldı',
    AWD: 'Hükmen',
    WO: 'Çekilme',
  },
  positions: {
    G: 'Kaleci',
    D: 'Defans',
    M: 'Orta Saha',
    F: 'Forvet',
    Goalkeeper: 'Kaleci',
    Defender: 'Defans',
    Midfielder: 'Orta Saha',
    Attacker: 'Forvet',
  },
  events: {
    Goal: 'Gol',
    Card: 'Kart',
    subst: 'Değişiklik',
    Var: 'VAR',
    'Normal Goal': 'Gol',
    'Own Goal': 'Kendi Kalesine',
    'Penalty': 'Penaltı',
    'Missed Penalty': 'Kaçan Penaltı',
    'Yellow Card': 'Sarı Kart',
    'Red Card': 'Kırmızı Kart',
    'Second Yellow card': 'İkinci Sarı',
    'Substitution 1': 'Oyuncu Girdi',
    'Substitution 2': 'Oyuncu Çıktı',
    'Substitution 3': 'Değişiklik',
    'Substitution 4': 'Değişiklik',
    'Substitution 5': 'Değişiklik',
    'Substitution 6': 'Değişiklik',
  },
  stats: {
    'Ball Possession': 'Top Hakimiyeti',
    'Total Shots': 'Toplam Şut',
    'Shots on Goal': 'İsabetli Şut',
    'Shots off Goal': 'İsabetsiz Şut',
    'Blocked Shots': 'Bloke Edilen Şut',
    'Shots insidebox': 'Ceza Sahası İçi Şut',
    'Shots outsidebox': 'Ceza Sahası Dışı Şut',
    'Fouls': 'Faul',
    'Corner Kicks': 'Korner',
    'Offsides': 'Ofsayt',
    'Yellow Cards': 'Sarı Kart',
    'Red Cards': 'Kırmızı Kart',
    'Goalkeeper Saves': 'Kaleci Kurtarışı',
    'Total passes': 'Toplam Pas',
    'Passes accurate': 'Başarılı Pas',
    'Passes %': 'Pas Yüzdesi',
    'expected_goals': 'Beklenen Gol (xG)',
  },
} as const;

// =============================================
// RENK PALETİ
// =============================================

export const COLORS = {
  primary: {
    navy: '#1E3A8A',
    navyDark: '#152a64',
    navyLight: '#2d4ea6',
  },
  secondary: {
    yellow: '#FCD34D',
    yellowDark: '#F59E0B',
    yellowLight: '#FDE68A',
    gold: '#FBBF24',
  },
  status: {
    live: '#ef4444',
    win: '#22c55e',
    draw: '#f59e0b',
    loss: '#ef4444',
  },
  pitch: {
    green: '#2d5a27',
    greenLight: '#3d7a37',
  },
} as const;

// =============================================
// FORM GÖSTERİMİ
// =============================================

export const FORM_DISPLAY = {
  W: { label: 'G', color: 'bg-win', title: 'Galibiyet' },
  D: { label: 'B', color: 'bg-draw', title: 'Beraberlik' },
  L: { label: 'M', color: 'bg-loss', title: 'Mağlubiyet' },
} as const;

// =============================================
// SAYFA ROTALARI
// =============================================

export const ROUTES = {
  HOME: '/',
  LIVE: '/canli',
  MATCHES: '/maclar',
  MATCH_DETAIL: (id: number) => `/maclar/${id}`,
  TOURNAMENTS: '/turnuvalar',
  TOURNAMENT_DETAIL: (id: number) => `/turnuvalar/${id}`,
  SQUAD: '/kadro',
  PLAYERS: '/futbolcular',
  PLAYER_DETAIL: (id: number) => `/futbolcular/${id}`,
  TRANSFERS: '/transferler',
  STATISTICS: '/istatistik',
} as const;
