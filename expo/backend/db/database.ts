import { Database, Team, Tournament, BonusType, DbConfig } from '../types';
import { hashPassword } from '../utils/password';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const createInitialDatabase = async (): Promise<Database> => {
  const adminPasswordHash = await hashPassword('Aa1!');
  const configPasswordHash = await hashPassword('Config1!');
  
  const teams: Team[] = [
    { id: 'team-ita', name: 'Italy', flagImageUrl: 'https://flagcdn.com/w80/it.png' },
    { id: 'team-ger', name: 'Germany', flagImageUrl: 'https://flagcdn.com/w80/de.png' },
    { id: 'team-fra', name: 'France', flagImageUrl: 'https://flagcdn.com/w80/fr.png' },
    { id: 'team-esp', name: 'Spain', flagImageUrl: 'https://flagcdn.com/w80/es.png' },
    { id: 'team-eng', name: 'England', flagImageUrl: 'https://flagcdn.com/w80/gb-eng.png' },
    { id: 'team-por', name: 'Portugal', flagImageUrl: 'https://flagcdn.com/w80/pt.png' },
    { id: 'team-ned', name: 'Netherlands', flagImageUrl: 'https://flagcdn.com/w80/nl.png' },
    { id: 'team-bel', name: 'Belgium', flagImageUrl: 'https://flagcdn.com/w80/be.png' },
  ];

  const tournaments: Tournament[] = [
    { id: 'tournament-euro2024', name: 'Euro 2024', createdAt: new Date().toISOString() },
  ];

  const tournamentTeams = teams.map(team => ({
    tournamentId: 'tournament-euro2024',
    teamId: team.id,
  }));

  const now = new Date();
  const matches = [
    {
      id: 'match-1',
      tournamentId: 'tournament-euro2024',
      startDatetime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      team1Id: 'team-ita',
      team2Id: 'team-ger',
      stage: 'NORMAL' as const,
      resultTeam1Goals: null,
      resultTeam2Goals: null,
      resultSetAt: null,
    },
    {
      id: 'match-2',
      tournamentId: 'tournament-euro2024',
      startDatetime: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      team1Id: 'team-fra',
      team2Id: 'team-esp',
      stage: 'NORMAL' as const,
      resultTeam1Goals: null,
      resultTeam2Goals: null,
      resultSetAt: null,
    },
    {
      id: 'match-3',
      tournamentId: 'tournament-euro2024',
      startDatetime: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
      team1Id: 'team-eng',
      team2Id: 'team-por',
      stage: 'SEMIFINAL' as const,
      resultTeam1Goals: null,
      resultTeam2Goals: null,
      resultSetAt: null,
    },
    {
      id: 'match-4',
      tournamentId: 'tournament-euro2024',
      startDatetime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      team1Id: 'team-ned',
      team2Id: 'team-bel',
      stage: 'NORMAL' as const,
      resultTeam1Goals: 2,
      resultTeam2Goals: 1,
      resultSetAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
  ];

  const dbConfig: DbConfig = {
    mysqlHost: 'localhost',
    mysqlPort: 3306,
    mysqlDatabase: 'betman',
    mysqlUsername: 'root',
    mysqlPassword: '',
    isConfigured: false,
    lastTestAt: null,
    lastTestResult: null,
  };

  return {
    users: [
      {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@betman.ch',
        role: 'ADMIN',
        passwordHash: adminPasswordHash,
        preferredLanguage: 'en',
        preferredTheme: 'system',
        favoriteTeamId: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'config-1',
        username: 'config',
        email: 'config@betman.ch',
        role: 'CONFIG',
        passwordHash: configPasswordHash,
        preferredLanguage: 'en',
        preferredTheme: 'system',
        favoriteTeamId: null,
        createdAt: new Date().toISOString(),
      },
    ],
    teams,
    tournaments,
    tournamentTeams,
    matches,
    predictions: [],
    bonusInventories: [],
    bonusUsages: [],
    shopPurchases: [],
    dbConfig,
  };
};

let db: Database | null = null;

export const getDatabase = async (): Promise<Database> => {
  if (!db) {
    db = await createInitialDatabase();
  }
  return db;
};

export const initializeBonusInventory = async (userId: string, tournamentId: string): Promise<void> => {
  const database = await getDatabase();
  const bonusTypes: BonusType[] = ['DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H'];
  
  for (const bonusType of bonusTypes) {
    const existing = database.bonusInventories.find(
      bi => bi.userId === userId && bi.tournamentId === tournamentId && bi.bonusType === bonusType
    );
    if (!existing) {
      database.bonusInventories.push({
        userId,
        tournamentId,
        bonusType,
        quantity: 1,
      });
    }
  }
};

export { generateId };
