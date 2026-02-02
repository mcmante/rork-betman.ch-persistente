import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getDatabase, generateId, initializeBonusInventory } from '../../db/database';
import { canRemoveBonus, canMakePrediction } from '../../utils/scoring';
import { BonusType } from '../../types';

export const bonusRouter = createTRPCRouter({
  getInventory: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDatabase();
      
      await initializeBonusInventory(ctx.user.id, input.tournamentId);
      
      return db.bonusInventories.filter(
        bi => bi.userId === ctx.user.id && bi.tournamentId === input.tournamentId
      );
    }),

  useBonus: protectedProcedure
    .input(z.object({
      matchId: z.string(),
      bonusType: z.enum(['DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const match = db.matches.find(m => m.id === input.matchId);

      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }

      const existingUsage = db.bonusUsages.find(
        bu => bu.matchId === input.matchId && bu.userId === ctx.user.id
      );

      if (existingUsage) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already using a bonus on this match' });
      }

      await initializeBonusInventory(ctx.user.id, match.tournamentId);

      const inventory = db.bonusInventories.find(
        bi => bi.userId === ctx.user.id && 
              bi.tournamentId === match.tournamentId && 
              bi.bonusType === input.bonusType
      );

      if (!inventory || inventory.quantity < 1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No bonus available' });
      }

      const now = Date.now();
      const matchStart = new Date(match.startDatetime).getTime();

      if (input.bonusType === 'PLUS_1H') {
        const oneHourAfter = matchStart + 60 * 60 * 1000;
        if (now >= oneHourAfter) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot use PLUS_1H bonus after 1 hour from match start' });
        }
      } else {
        if (now >= matchStart) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot use this bonus after match start' });
        }
      }

      inventory.quantity -= 1;

      const bonusUsage = {
        id: generateId(),
        userId: ctx.user.id,
        matchId: input.matchId,
        bonusType: input.bonusType,
        usedAt: new Date().toISOString(),
      };

      db.bonusUsages.push(bonusUsage);
      return bonusUsage;
    }),

  removeBonus: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const match = db.matches.find(m => m.id === input.matchId);

      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }

      const usageIndex = db.bonusUsages.findIndex(
        bu => bu.matchId === input.matchId && bu.userId === ctx.user.id
      );

      if (usageIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No bonus usage found' });
      }

      const usage = db.bonusUsages[usageIndex];

      if (!canRemoveBonus(usage.bonusType, match)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot remove bonus after deadline' });
      }

      const inventory = db.bonusInventories.find(
        bi => bi.userId === ctx.user.id && 
              bi.tournamentId === match.tournamentId && 
              bi.bonusType === usage.bonusType
      );

      if (inventory) {
        inventory.quantity += 1;
      }

      db.bonusUsages.splice(usageIndex, 1);
      return { success: true };
    }),
});
