import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../create-context';
import { getDatabase, generateId, initializeBonusInventory } from '../../db/database';

export const tournamentsRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    const db = await getDatabase();
    return db.tournaments;
  }),

  getById: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tournament = db.tournaments.find(t => t.id === input.tournamentId);
      
      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      const teamIds = db.tournamentTeams
        .filter(tt => tt.tournamentId === input.tournamentId)
        .map(tt => tt.teamId);
      
      const teams = db.teams.filter(t => teamIds.includes(t.id));

      return { ...tournament, teams };
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      teamIds: z.array(z.string()).min(2),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();

      if (db.tournaments.some(t => t.name.toLowerCase() === input.name.toLowerCase())) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Tournament name already exists' });
      }

      for (const teamId of input.teamIds) {
        if (!db.teams.some(t => t.id === teamId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Team ${teamId} not found` });
        }
      }

      const newTournament = {
        id: generateId(),
        name: input.name,
        createdAt: new Date().toISOString(),
      };

      db.tournaments.push(newTournament);

      for (const teamId of input.teamIds) {
        db.tournamentTeams.push({
          tournamentId: newTournament.id,
          teamId,
        });
      }

      return newTournament;
    }),

  updateTeams: adminProcedure
    .input(z.object({
      tournamentId: z.string(),
      teamIds: z.array(z.string()).min(2),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const tournament = db.tournaments.find(t => t.id === input.tournamentId);

      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      for (const teamId of input.teamIds) {
        if (!db.teams.some(t => t.id === teamId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Team ${teamId} not found` });
        }
      }

      const matchTeamIds = new Set<string>();
      db.matches
        .filter(m => m.tournamentId === input.tournamentId)
        .forEach(m => {
          matchTeamIds.add(m.team1Id);
          matchTeamIds.add(m.team2Id);
        });

      for (const usedTeamId of matchTeamIds) {
        if (!input.teamIds.includes(usedTeamId)) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Cannot remove team that is used in existing matches' 
          });
        }
      }

      db.tournamentTeams = db.tournamentTeams.filter(tt => tt.tournamentId !== input.tournamentId);

      for (const teamId of input.teamIds) {
        db.tournamentTeams.push({
          tournamentId: input.tournamentId,
          teamId,
        });
      }

      return tournament;
    }),

  delete: adminProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();

      const hasMatches = db.matches.some(m => m.tournamentId === input.tournamentId);
      if (hasMatches) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete tournament with matches' });
      }

      const index = db.tournaments.findIndex(t => t.id === input.tournamentId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      db.tournaments.splice(index, 1);
      db.tournamentTeams = db.tournamentTeams.filter(tt => tt.tournamentId !== input.tournamentId);

      return { success: true };
    }),

  initializeForUser: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const tournament = db.tournaments.find(t => t.id === input.tournamentId);
      
      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      await initializeBonusInventory(ctx.user.id, input.tournamentId);
      return { success: true };
    }),
});
