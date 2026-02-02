export type UserRole = 'ADMIN' | 'PLAYER' | 'CONFIG';
export type MatchStage = 'NORMAL' | 'SEMIFINAL' | 'FINAL';
export type BonusType = 'DOUBLE_POINTS' | 'GOAL_DIFF_MULTIPLIER' | 'PLUS_1H';
export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'it' | 'en';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  preferredLanguage: Language;
  preferredTheme: ThemePreference;
  favoriteTeamId: string | null;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  flagImageUrl: string;
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
}

export interface TournamentTeam {
  tournamentId: string;
  teamId: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  startDatetime: string;
  team1Id: string;
  team2Id: string;
  stage: MatchStage;
  resultTeam1Goals: number | null;
  resultTeam2Goals: number | null;
  resultSetAt: string | null;
}

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  predTeam1Goals: number;
  predTeam2Goals: number;
  createdAt: string;
  updatedAt: string;
}

export interface BonusInventory {
  userId: string;
  tournamentId: string;
  bonusType: BonusType;
  quantity: number;
}

export interface BonusUsage {
  id: string;
  userId: string;
  matchId: string;
  bonusType: BonusType;
  usedAt: string;
}

export interface ShopPurchase {
  id: string;
  userId: string;
  tournamentId: string;
  bonusType: BonusType;
  costPoints: number;
  purchasedAt: string;
}

export interface DbConfig {
  mysqlHost: string;
  mysqlPort: number;
  mysqlDatabase: string;
  mysqlUsername: string;
  mysqlPassword: string;
  isConfigured: boolean;
  lastTestAt: string | null;
  lastTestResult: boolean | null;
}

export interface Database {
  users: User[];
  teams: Team[];
  tournaments: Tournament[];
  tournamentTeams: TournamentTeam[];
  matches: Match[];
  predictions: Prediction[];
  bonusInventories: BonusInventory[];
  bonusUsages: BonusUsage[];
  shopPurchases: ShopPurchase[];
  dbConfig: DbConfig;
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  rank: number;
}

export interface MatchWithDetails extends Match {
  team1: Team;
  team2: Team;
  prediction?: Prediction;
  bonusUsage?: BonusUsage;
  isFavoriteTeamMatch: boolean;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  preferredLanguage: Language;
  preferredTheme: ThemePreference;
  favoriteTeamId: string | null;
  createdAt: string;
}
