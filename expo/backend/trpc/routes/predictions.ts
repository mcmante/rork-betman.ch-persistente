import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getDatabase, generateId } from '../../db/database';
import { canMakePrediction } from '../../utils/scoring';

export const predictionsRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(z.object({
      matchId: z.string(),
      team1Goals: z.number().int().min(0),
      team2Goals: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const match = db.matches.find(m => m.id === input.matchId);

      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }

      const bonusUsage = db.bonusUsages.find(
        bu => bu.matchId === input.matchId && bu.userId === ctx.user.id && bu.bonusType === 'PLUS_1H'
      );
      const hasPlus1HBonus = !!bonusUsage;

      if (!canMakePrediction(match, hasPlus1HBonus)) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: hasPlus1HBonus 
            ? 'Prediction window closed (1 hour after match start)' 
            : 'Prediction window closed (match has started)' 
        });
      }

      const existingPrediction = db.predictions.find(
        p => p.matchId === input.matchId && p.userId === ctx.user.id
      );

      if (existingPrediction) {
        existingPrediction.predTeam1Goals = input.team1Goals;
        existingPrediction.predTeam2Goals = input.team2Goals;
        existingPrediction.updatedAt = new Date().toISOString();
        return existingPrediction;
      }

      const newPrediction = {
        id: generateId(),
        matchId: input.matchId,
        userId: ctx.user.id,
        predTeam1Goals: input.team1Goals,
        predTeam2Goals: input.team2Goals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.predictions.push(newPrediction);
      return newPrediction;
    }),

  getByMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDatabase();
      return db.predictions.find(
        p => p.matchId === input.matchId && p.userId === ctx.user.id
      ) || null;
    }),
});
