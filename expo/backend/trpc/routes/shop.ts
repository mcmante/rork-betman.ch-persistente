import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getDatabase, generateId, initializeBonusInventory } from '../../db/database';
import { 
  calculateBasePoints, 
  calculateBonusMultiplier, 
  calculateFavoriteTeamMultiplier, 
  calculateStageMultiplier,
  calculateFinalPoints 
} from '../../utils/scoring';

const BONUS_COST = 3;
const MAX_PURCHASES_PER_TOURNAMENT = 5;

const calculateUserPoints = async (userId: string, tournamentId: string): Promise<number> => {
  const db = await getDatabase();
  const user = db.users.find(u => u.id === userId);
  if (!user) return 0;

  const matches = db.matches.filter(
    m => m.tournamentId === tournamentId && m.resultTeam1Goals !== null
  );

  let totalPoints = 0;

  for (const match of matches) {
    const prediction = db.predictions.find(
      p => p.matchId === match.id && p.userId === userId
    );

    if (!prediction) continue;

    const bonusUsage = db.bonusUsages.find(
      bu => bu.matchId === match.id && bu.userId === userId
    );

    const basePoints = calculateBasePoints(prediction, match);
    const bonusMultiplier = calculateBonusMultiplier(bonusUsage, match);
    const favoriteMultiplier = calculateFavoriteTeamMultiplier(user.favoriteTeamId, match);
    const stageMultiplier = calculateStageMultiplier(match);

    totalPoints += calculateFinalPoints(basePoints, bonusMultiplier, favoriteMultiplier, stageMultiplier);
  }

  const purchases = db.shopPurchases.filter(
    sp => sp.userId === userId && sp.tournamentId === tournamentId
  );
  const totalSpent = purchases.reduce((sum, p) => sum + p.costPoints, 0);

  return totalPoints - totalSpent;
};

export const shopRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDatabase();
      
      await initializeBonusInventory(ctx.user.id, input.tournamentId);

      const currentPoints = await calculateUserPoints(ctx.user.id, input.tournamentId);
      
      const purchaseCount = db.shopPurchases.filter(
        sp => sp.userId === ctx.user.id && sp.tournamentId === input.tournamentId
      ).length;

      const inventory = db.bonusInventories.filter(
        bi => bi.userId === ctx.user.id && bi.tournamentId === input.tournamentId
      );

      return {
        currentPoints,
        purchaseCount,
        maxPurchases: MAX_PURCHASES_PER_TOURNAMENT,
        bonusCost: BONUS_COST,
        canPurchase: currentPoints >= BONUS_COST && purchaseCount < MAX_PURCHASES_PER_TOURNAMENT,
        inventory,
      };
    }),

  purchase: protectedProcedure
    .input(z.object({
      tournamentId: z.string(),
      bonusType: z.enum(['DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();

      const tournament = db.tournaments.find(t => t.id === input.tournamentId);
      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      const currentPoints = await calculateUserPoints(ctx.user.id, input.tournamentId);
      
      if (currentPoints < BONUS_COST) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient points' });
      }

      const purchaseCount = db.shopPurchases.filter(
        sp => sp.userId === ctx.user.id && sp.tournamentId === input.tournamentId
      ).length;

      if (purchaseCount >= MAX_PURCHASES_PER_TOURNAMENT) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Purchase limit reached' });
      }

      await initializeBonusInventory(ctx.user.id, input.tournamentId);

      const inventory = db.bonusInventories.find(
        bi => bi.userId === ctx.user.id && 
              bi.tournamentId === input.tournamentId && 
              bi.bonusType === input.bonusType
      );

      if (inventory) {
        inventory.quantity += 1;
      }

      const purchase = {
        id: generateId(),
        userId: ctx.user.id,
        tournamentId: input.tournamentId,
        bonusType: input.bonusType,
        costPoints: BONUS_COST,
        purchasedAt: new Date().toISOString(),
      };

      db.shopPurchases.push(purchase);

      return {
        purchase,
        newPoints: currentPoints - BONUS_COST,
        newInventory: db.bonusInventories.filter(
          bi => bi.userId === ctx.user.id && bi.tournamentId === input.tournamentId
        ),
      };
    }),
});
