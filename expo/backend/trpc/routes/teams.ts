import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../create-context';
import { getDatabase, generateId } from '../../db/database';

export const teamsRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    const db = await getDatabase();
    return db.teams;
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      flagImageUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();

      if (db.teams.some(t => t.name.toLowerCase() === input.name.toLowerCase())) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Team name already exists' });
      }

      const newTeam = {
        id: generateId(),
        name: input.name,
        flagImageUrl: input.flagImageUrl,
      };

      db.teams.push(newTeam);
      return newTeam;
    }),

  update: adminProcedure
    .input(z.object({
      teamId: z.string(),
      name: z.string().min(1).optional(),
      flagImageUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const team = db.teams.find(t => t.id === input.teamId);

      if (!team) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }

      if (input.name) {
        if (db.teams.some(t => t.id !== input.teamId && t.name.toLowerCase() === input.name!.toLowerCase())) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Team name already exists' });
        }
        team.name = input.name;
      }

      if (input.flagImageUrl) {
        team.flagImageUrl = input.flagImageUrl;
      }

      return team;
    }),

  delete: adminProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      
      const usedInMatch = db.matches.some(
        m => m.team1Id === input.teamId || m.team2Id === input.teamId
      );
      
      if (usedInMatch) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete team used in matches' });
      }

      const index = db.teams.findIndex(t => t.id === input.teamId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }

      db.teams.splice(index, 1);
      db.tournamentTeams = db.tournamentTeams.filter(tt => tt.teamId !== input.teamId);
      
      return { success: true };
    }),
});
