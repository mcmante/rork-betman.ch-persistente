import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getDatabase } from '../../db/database';
import { 
  calculateBasePoints, 
  calculateBonusMultiplier, 
  calculateFavoriteTeamMultiplier, 
  calculateStageMultiplier,
  calculateFinalPoints 
} from '../../utils/scoring';
import { LeaderboardEntry } from '../../types';

export const leaderboardRouter = createTRPCRouter({
  getByTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDatabase();

      const tournament = db.tournaments.find(t => t.id === input.tournamentId);
      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      const matches = db.matches.filter(
        m => m.tournamentId === input.tournamentId && m.resultTeam1Goals !== null
      );

      const players = db.users.filter(u => u.role === 'PLAYER');
      const entries: LeaderboardEntry[] = [];

      for (const player of players) {
        let totalPoints = 0;

        for (const match of matches) {
          const prediction = db.predictions.find(
            p => p.matchId === match.id && p.userId === player.id
          );

          if (!prediction) continue;

          const bonusUsage = db.bonusUsages.find(
            bu => bu.matchId === match.id && bu.userId === player.id
          );

          const basePoints = calculateBasePoints(prediction, match);
          const bonusMultiplier = calculateBonusMultiplier(bonusUsage, match);
          const favoriteMultiplier = calculateFavoriteTeamMultiplier(player.favoriteTeamId, match);
          const stageMultiplier = calculateStageMultiplier(match);

          totalPoints += calculateFinalPoints(basePoints, bonusMultiplier, favoriteMultiplier, stageMultiplier);
        }

        const purchases = db.shopPurchases.filter(
          sp => sp.userId === player.id && sp.tournamentId === input.tournamentId
        );
        const totalSpent = purchases.reduce((sum, p) => sum + p.costPoints, 0);

        entries.push({
          userId: player.id,
          username: player.username,
          totalPoints: totalPoints - totalSpent,
          rank: 0,
        });
      }

      entries.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return a.username.localeCompare(b.username);
      });

      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    }),
});
