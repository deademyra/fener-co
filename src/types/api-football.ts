// API-Football v3 Type Definitions
// Fenerbahçe Stats - FENER.CO

// ============================================
// League & Season Types
// ============================================

export interface League {
  id: number;
  name: string;
  type: 'League' | 'Cup';
  logo: string;
  country?: {
    name: string;
    code: string;
    flag: string;
  };
}

export interface Season {
  year: number | string;
  start: string;
  end: string;
  current: boolean;
}

export interface LeagueWithSeasons extends League {
  seasons: Season[];
}

// ============================================
// Round & Stage Types
// ============================================

// Round types for different competition formats
export type LeagueRoundType = 
  | `Regular Season - ${number}`  // Süper Lig: "Regular Season - 1" to "Regular Season - 38"
  | string;

export type CupRoundType =
  // Turkish Cup Qualifying Rounds
  | '1st Round'
  | '2nd Round' 
  | '3rd Round'
  | '4th Round'
  | '5th Round'
  // Turkish Cup Group Stage
  | 'Group A'
  | 'Group B'
  | 'Group C'
  | 'Group D'
  // Knockout Rounds (shared)
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-finals'
  | 'Semi-finals'
  | 'Final';

export type UEFARoundType =
  // Qualifying Rounds
  | '1st Qualifying Round'
  | '2nd Qualifying Round'
  | '3rd Qualifying Round'
  | 'Play-off Round'
  // League Phase (2024/25 new format)
  | `League Stage - ${number}`  // "League Stage - 1" to "League Stage - 8"
  // Old Group Stage format (pre-2024)
  | `Group ${string} - ${number}` // "Group A - 1" to "Group H - 6"
  // Knockout Phase
  | 'Knockout Round Play-offs'
  | 'Round of 16'
  | 'Quarter-finals'
  | 'Semi-finals'
  | 'Final';

export type RoundType = LeagueRoundType | CupRoundType | UEFARoundType;

// Stage categories for UI grouping
export type StageCategory = 
  | 'qualifying'
  | 'league_phase'
  | 'group_stage'
  | 'knockout'
  | 'final';

export interface RoundInfo {
  round: string;
  category: StageCategory;
  displayName: string;
  displayNameTr: string;
  order: number;
}

// ============================================
// Fixture Types
// ============================================

export interface FixtureStatus {
  long: string;
  short: 'TBD' | 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'SUSP' | 'INT' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';
  elapsed: number | null;
}

export interface FixtureVenue {
  id: number | null;
  name: string;
  city: string;
}

export interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface FixtureGoals {
  home: number | null;
  away: number | null;
}

export interface FixtureScore {
  halftime: FixtureGoals;
  fulltime: FixtureGoals;
  extratime: FixtureGoals;
  penalty: FixtureGoals;
}

export interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: FixtureVenue;
    status: FixtureStatus;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals: FixtureGoals;
  score: FixtureScore;
}

// ============================================
// Standings Types
// ============================================

export interface StandingTeam {
  id: number;
  name: string;
  logo: string;
}

export interface StandingGoals {
  for: number;
  against: number;
}

export interface StandingRecord {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: StandingGoals;
}

export interface Standing {
  rank: number;
  team: StandingTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: StandingRecord;
  home: StandingRecord;
  away: StandingRecord;
  update: string;
}

// League Phase Standings (new UCL format)
export interface LeaguePhaseStanding extends Standing {
  // Additional fields for Swiss-system
  qualified?: boolean;
  playoffSeeded?: boolean;
  playoffUnseeded?: boolean;
  eliminated?: boolean;
}

// Group Standings (old format / Turkish Cup)
export interface GroupStandings {
  [groupName: string]: Standing[];
}

// ============================================
// Competition Config Types
// ============================================

export interface CompetitionConfig {
  id: number;
  name: string;
  nameTr: string;
  type: 'league' | 'cup' | 'uefa';
  format: 'league' | 'knockout' | 'hybrid' | 'swiss';
  hasGroups: boolean;
  hasLeaguePhase: boolean; // For new UEFA format
  roundStructure: RoundInfo[];
  seasons: number[];
}

// Fenerbahçe tracked competitions
export const FENERBAHCE_COMPETITIONS: CompetitionConfig[] = [
  {
    id: 203,
    name: 'Süper Lig',
    nameTr: 'Süper Lig',
    type: 'league',
    format: 'league',
    hasGroups: false,
    hasLeaguePhase: false,
    roundStructure: Array.from({ length: 38 }, (_, i) => ({
      round: `Regular Season - ${i + 1}`,
      category: 'league_phase' as StageCategory,
      displayName: `Week ${i + 1}`,
      displayNameTr: `${i + 1}. Hafta`,
      order: i + 1
    })),
    seasons: [2020, 2021, 2022, 2023, 2024, 2025]
  },
  {
    id: 206,
    name: 'Turkish Cup',
    nameTr: 'Türkiye Kupası',
    type: 'cup',
    format: 'hybrid', // Groups + Knockout
    hasGroups: true,
    hasLeaguePhase: false,
    roundStructure: [
      // Qualifying rounds
      { round: '1st Round', category: 'qualifying', displayName: '1st Round', displayNameTr: '1. Tur', order: 1 },
      { round: '2nd Round', category: 'qualifying', displayName: '2nd Round', displayNameTr: '2. Tur', order: 2 },
      { round: '3rd Round', category: 'qualifying', displayName: '3rd Round', displayNameTr: '3. Tur', order: 3 },
      { round: '4th Round', category: 'qualifying', displayName: '4th Round', displayNameTr: '4. Tur', order: 4 },
      { round: '5th Round', category: 'qualifying', displayName: '5th Round', displayNameTr: '5. Tur', order: 5 },
      // Group Stage (2024-25 new format)
      { round: 'Group A', category: 'group_stage', displayName: 'Group A', displayNameTr: 'A Grubu', order: 6 },
      { round: 'Group B', category: 'group_stage', displayName: 'Group B', displayNameTr: 'B Grubu', order: 7 },
      { round: 'Group C', category: 'group_stage', displayName: 'Group C', displayNameTr: 'C Grubu', order: 8 },
      { round: 'Group D', category: 'group_stage', displayName: 'Group D', displayNameTr: 'D Grubu', order: 9 },
      // Knockout
      { round: 'Quarter-finals', category: 'knockout', displayName: 'Quarter-finals', displayNameTr: 'Çeyrek Final', order: 10 },
      { round: 'Semi-finals', category: 'knockout', displayName: 'Semi-finals', displayNameTr: 'Yarı Final', order: 11 },
      { round: 'Final', category: 'final', displayName: 'Final', displayNameTr: 'Final', order: 12 },
    ],
    seasons: [2020, 2021, 2022, 2023, 2024, 2025]
  },
  {
    id: 2,
    name: 'UEFA Champions League',
    nameTr: 'UEFA Şampiyonlar Ligi',
    type: 'uefa',
    format: 'swiss', // New format from 2024-25
    hasGroups: false, // No groups in new format
    hasLeaguePhase: true,
    roundStructure: [
      // Qualifying
      { round: '1st Qualifying Round', category: 'qualifying', displayName: '1st Qualifying', displayNameTr: '1. Eleme Turu', order: 1 },
      { round: '2nd Qualifying Round', category: 'qualifying', displayName: '2nd Qualifying', displayNameTr: '2. Eleme Turu', order: 2 },
      { round: '3rd Qualifying Round', category: 'qualifying', displayName: '3rd Qualifying', displayNameTr: '3. Eleme Turu', order: 3 },
      { round: 'Play-off Round', category: 'qualifying', displayName: 'Play-off', displayNameTr: 'Play-off Turu', order: 4 },
      // League Phase (new format)
      ...Array.from({ length: 8 }, (_, i) => ({
        round: `League Stage - ${i + 1}`,
        category: 'league_phase' as StageCategory,
        displayName: `Matchday ${i + 1}`,
        displayNameTr: `${i + 1}. Maç Haftası`,
        order: 5 + i
      })),
      // Knockout
      { round: 'Knockout Round Play-offs', category: 'knockout', displayName: 'Knockout Play-offs', displayNameTr: 'Eleme Play-off', order: 13 },
      { round: 'Round of 16', category: 'knockout', displayName: 'Round of 16', displayNameTr: 'Son 16', order: 14 },
      { round: 'Quarter-finals', category: 'knockout', displayName: 'Quarter-finals', displayNameTr: 'Çeyrek Final', order: 15 },
      { round: 'Semi-finals', category: 'knockout', displayName: 'Semi-finals', displayNameTr: 'Yarı Final', order: 16 },
      { round: 'Final', category: 'final', displayName: 'Final', displayNameTr: 'Final', order: 17 },
    ],
    seasons: [2020, 2021, 2022, 2023, 2024, 2025]
  },
  {
    id: 3,
    name: 'UEFA Europa League',
    nameTr: 'UEFA Avrupa Ligi',
    type: 'uefa',
    format: 'swiss',
    hasGroups: false,
    hasLeaguePhase: true,
    roundStructure: [
      { round: '2nd Qualifying Round', category: 'qualifying', displayName: '2nd Qualifying', displayNameTr: '2. Eleme Turu', order: 1 },
      { round: '3rd Qualifying Round', category: 'qualifying', displayName: '3rd Qualifying', displayNameTr: '3. Eleme Turu', order: 2 },
      { round: 'Play-off Round', category: 'qualifying', displayName: 'Play-off', displayNameTr: 'Play-off Turu', order: 3 },
      ...Array.from({ length: 8 }, (_, i) => ({
        round: `League Stage - ${i + 1}`,
        category: 'league_phase' as StageCategory,
        displayName: `Matchday ${i + 1}`,
        displayNameTr: `${i + 1}. Maç Haftası`,
        order: 4 + i
      })),
      { round: 'Knockout Round Play-offs', category: 'knockout', displayName: 'Knockout Play-offs', displayNameTr: 'Eleme Play-off', order: 12 },
      { round: 'Round of 16', category: 'knockout', displayName: 'Round of 16', displayNameTr: 'Son 16', order: 13 },
      { round: 'Quarter-finals', category: 'knockout', displayName: 'Quarter-finals', displayNameTr: 'Çeyrek Final', order: 14 },
      { round: 'Semi-finals', category: 'knockout', displayName: 'Semi-finals', displayNameTr: 'Yarı Final', order: 15 },
      { round: 'Final', category: 'final', displayName: 'Final', displayNameTr: 'Final', order: 16 },
    ],
    seasons: [2020, 2021, 2022, 2023, 2024, 2025]
  },
  {
    id: 848,
    name: 'UEFA Europa Conference League',
    nameTr: 'UEFA Konferans Ligi',
    type: 'uefa',
    format: 'swiss',
    hasGroups: false,
    hasLeaguePhase: true,
    roundStructure: [
      { round: '1st Qualifying Round', category: 'qualifying', displayName: '1st Qualifying', displayNameTr: '1. Eleme Turu', order: 1 },
      { round: '2nd Qualifying Round', category: 'qualifying', displayName: '2nd Qualifying', displayNameTr: '2. Eleme Turu', order: 2 },
      { round: '3rd Qualifying Round', category: 'qualifying', displayName: '3rd Qualifying', displayNameTr: '3. Eleme Turu', order: 3 },
      { round: 'Play-off Round', category: 'qualifying', displayName: 'Play-off', displayNameTr: 'Play-off Turu', order: 4 },
      ...Array.from({ length: 6 }, (_, i) => ({
        round: `League Stage - ${i + 1}`,
        category: 'league_phase' as StageCategory,
        displayName: `Matchday ${i + 1}`,
        displayNameTr: `${i + 1}. Maç Haftası`,
        order: 5 + i
      })),
      { round: 'Knockout Round Play-offs', category: 'knockout', displayName: 'Knockout Play-offs', displayNameTr: 'Eleme Play-off', order: 11 },
      { round: 'Round of 16', category: 'knockout', displayName: 'Round of 16', displayNameTr: 'Son 16', order: 12 },
      { round: 'Quarter-finals', category: 'knockout', displayName: 'Quarter-finals', displayNameTr: 'Çeyrek Final', order: 13 },
      { round: 'Semi-finals', category: 'knockout', displayName: 'Semi-finals', displayNameTr: 'Yarı Final', order: 14 },
      { round: 'Final', category: 'final', displayName: 'Final', displayNameTr: 'Final', order: 15 },
    ],
    seasons: [2021, 2022, 2023, 2024, 2025]
  }
];

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T> {
  get: string;
  parameters: Record<string, string | number>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

export type RoundsResponse = APIResponse<string[]>;
export type FixturesResponse = APIResponse<Fixture[]>;
export type StandingsResponse = APIResponse<{ league: { standings: Standing[][] } }[]>;
export type LeaguesResponse = APIResponse<{ league: League; country: League['country']; seasons: Season[] }[]>;
