// =============================================
// API-FOOTBALL RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

// =============================================
// TEAM TYPES
// =============================================

export interface Team {
  id: number;
  name: string;
  code: string | null;
  country: string;
  founded: number | null;
  national: boolean;
  logo: string;
}

export interface TeamWithVenue extends Team {
  venue: Venue;
}

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  city: string;
  capacity: number;
  surface: string;
  image: string;
}

// =============================================
// LEAGUE TYPES
// =============================================

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round?: string;
}

export interface LeagueInfo {
  league: League;
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Season[];
}

export interface Season {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: {
    fixtures: {
      events: boolean;
      lineups: boolean;
      statistics_fixtures: boolean;
      statistics_players: boolean;
    };
    standings: boolean;
    players: boolean;
    top_scorers: boolean;
    top_assists: boolean;
    top_cards: boolean;
    injuries: boolean;
    predictions: boolean;
    odds: boolean;
  };
}

// =============================================
// FIXTURE TYPES
// =============================================

export interface Fixture {
  fixture: FixtureInfo;
  league: League;
  teams: {
    home: TeamScore;
    away: TeamScore;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
  events?: FixtureEvent[];
  lineups?: Lineup[];
  statistics?: TeamStatistics[];
  players?: FixturePlayerStats[];
}

export interface FixtureInfo {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string;
    city: string;
  };
  status: {
    long: string;
    short: FixtureStatus;
    elapsed: number | null;
  };
}

export type FixtureStatus = 
  | 'TBD' | 'NS' | 'LIVE' | '1H' | 'HT' | '2H' 
  | 'ET' | 'BT' | 'P' | 'SUSP' | 'INT' | 'FT' 
  | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO';

export interface TeamScore {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

// =============================================
// EVENT TYPES
// =============================================

export interface FixtureEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: EventType;
  detail: string;
  comments: string | null;
}

export type EventType = 'Goal' | 'Card' | 'subst' | 'Var';

// =============================================
// LINEUP TYPES
// =============================================

export interface Lineup {
  team: Team;
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: {
    id: number;
    name: string;
    photo: string;
  };
}

export interface LineupPlayer {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string;
    grid: string | null;
  };
}

// =============================================
// STATISTICS TYPES
// =============================================

export interface TeamStatistics {
  team: Team;
  statistics: StatisticItem[];
}

export interface StatisticItem {
  type: string;
  value: number | string | null;
}

export interface FixturePlayerStats {
  team: Team;
  players: PlayerMatchStats[];
}

export interface PlayerMatchStats {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: PlayerStatistics[];
}

export interface PlayerStatistics {
  games: {
    minutes: number | null;
    number: number;
    position: string;
    rating: string | null;
    captain: boolean;
    substitute: boolean;
  };
  offsides: number | null;
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
  passes: { total: number | null; key: number | null; accuracy: string | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null; past: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number; red: number };
  penalty: { won: number | null; committed: number | null; scored: number | null; missed: number | null; saved: number | null };
}

// =============================================
// PLAYER TYPES
// =============================================

export interface Player {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string | null;
    country: string;
  };
  nationality: string;
  height: string | null;
  weight: string | null;
  injured: boolean;
  photo: string;
}

export interface PlayerWithStats {
  player: Player;
  statistics: PlayerSeasonStats[];
}

export interface PlayerSeasonStats {
  team: Team;
  league: League;
  games: {
    appearences: number | null; // Note: API uses this spelling
    lineups: number | null;
    minutes: number | null;
    number: number | null;
    position: string;
    rating: string | null;
    captain: boolean;
  };
  substitutes: {
    in: number | null;
    out: number | null;
    bench: number | null;
  };
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null; past: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; yellowred: number | null; red: number | null };
  penalty: { won: number | null; committed: number | null; scored: number | null; missed: number | null; saved: number | null };
}

// =============================================
// STANDINGS TYPES
// =============================================

export interface StandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: Standing[][];
  };
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: StandingStats;
  home: StandingStats;
  away: StandingStats;
  update: string;
}

export interface StandingStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: {
    for: number;
    against: number;
  };
}

// =============================================
// SQUAD TYPES
// =============================================

export interface SquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
  nationality?: string; // Optional - may not always be available from API
}

export interface Squad {
  team: Team;
  players: SquadPlayer[];
}

// =============================================
// TRANSFER TYPES
// =============================================

export interface Transfer {
  player: {
    id: number;
    name: string;
  };
  update: string;
  transfers: TransferDetail[];
}

export interface TransferDetail {
  date: string;
  type: string;
  teams: {
    in: Team;
    out: Team;
  };
}

// =============================================
// COACH TYPES
// =============================================

export interface Coach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string | null;
    country: string;
  };
  nationality: string;
  height: string | null;
  weight: string | null;
  photo: string;
  team: Team;
  career: CoachCareer[];
}

export interface CoachCareer {
  team: Team;
  start: string;
  end: string | null;
}

// =============================================
// TOP SCORERS / ASSISTS
// =============================================

export interface TopScorer {
  player: Player;
  statistics: PlayerSeasonStats[];
}

// =============================================
// TEAM SEASON STATISTICS TYPES (from /teams/statistics endpoint)
// =============================================

export interface TeamSeasonStatistics {
  league: League;
  team: Team;
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: GoalsByMinute;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: GoalsByMinute;
    };
  };
  biggest: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
    goals: {
      for: { home: number; away: number };
      against: { home: number; away: number };
    };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  penalty: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups: Array<{
    formation: string;
    played: number;
  }>;
  cards: {
    yellow: CardsByMinute;
    red: CardsByMinute;
  };
}

export interface GoalsByMinute {
  '0-15': { total: number | null; percentage: string | null };
  '16-30': { total: number | null; percentage: string | null };
  '31-45': { total: number | null; percentage: string | null };
  '46-60': { total: number | null; percentage: string | null };
  '61-75': { total: number | null; percentage: string | null };
  '76-90': { total: number | null; percentage: string | null };
  '91-105': { total: number | null; percentage: string | null };
  '106-120': { total: number | null; percentage: string | null };
}

export interface CardsByMinute {
  '0-15': { total: number | null; percentage: string | null };
  '16-30': { total: number | null; percentage: string | null };
  '31-45': { total: number | null; percentage: string | null };
  '46-60': { total: number | null; percentage: string | null };
  '61-75': { total: number | null; percentage: string | null };
  '76-90': { total: number | null; percentage: string | null };
  '91-105': { total: number | null; percentage: string | null };
  '106-120': { total: number | null; percentage: string | null };
}

// =============================================
// CACHE TYPES
// =============================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  livescore: number;
  todayFixtures: number;
  standings: number;
  teamInfo: number;
  playerInfo: number;
  completedMatch: number;
  historicalData: number;
}

// =============================================
// APP SPECIFIC TYPES
// =============================================

export interface FenerbahceConfig {
  teamId: number;
  trackedLeagues: number[];
  currentSeason: number;
}

export interface MatchCardData {
  id: number;
  date: string;
  status: FixtureStatus;
  elapsed: number | null;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  isFenerbahceMatch: boolean;
}

export interface LiveMatchData extends MatchCardData {
  events: FixtureEvent[];
}

// =============================================
// API STATUS TYPES
// =============================================

export interface ApiStatusResponse {
  account: {
    firstname: string;
    lastname: string;
    email: string;
  };
  subscription: {
    plan: string;
    end: string;
    active: boolean;
  };
  requests: {
    current: number;
    limit_day: number;
  };
}

// =============================================
// PLAYER TRANSFER TYPES
// =============================================

export interface PlayerTransfer {
  date: string;
  type: string;
  teams: {
    in: {
      id: number;
      name: string;
      logo: string;
    };
    out: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

export interface PlayerTransferResponse {
  player: {
    id: number;
    name: string;
  };
  update: string;
  transfers: PlayerTransfer[];
}

// =============================================
// PLAYER TROPHY TYPES
// =============================================

export interface PlayerTrophy {
  league: string;
  country: string;
  season: string | null;
  place: string;
}

// =============================================
// PLAYER SIDELINED (INJURY HISTORY) TYPES
// =============================================

export interface PlayerSidelined {
  type: string;
  start: string;
  end: string;
}

// =============================================
// PLAYER TEAMS TYPES
// =============================================

export interface PlayerTeam {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  seasons: number[];
}

// =============================================
// FIXTURE PLAYER INDIVIDUAL STATS
// =============================================

export interface FixtureIndividualPlayerStats {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    games: {
      minutes: number | null;
      number: number | null;
      position: string | null;
      rating: string | null;
      captain: boolean;
      substitute: boolean;
    };
    offsides: number | null;
    shots: {
      total: number | null;
      on: number | null;
    };
    goals: {
      total: number | null;
      conceded: number | null;
      assists: number | null;
      saves: number | null;
    };
    passes: {
      total: number | null;
      key: number | null;
      accuracy: string | null;
    };
    tackles: {
      total: number | null;
      blocks: number | null;
      interceptions: number | null;
    };
    duels: {
      total: number | null;
      won: number | null;
    };
    dribbles: {
      attempts: number | null;
      success: number | null;
      past: number | null;
    };
    fouls: {
      drawn: number | null;
      committed: number | null;
    };
    cards: {
      yellow: number;
      red: number;
    };
    penalty: {
      won: number | null;
      committed: number | null;
      scored: number | null;
      missed: number | null;
      saved: number | null;
    };
  }>;
}
