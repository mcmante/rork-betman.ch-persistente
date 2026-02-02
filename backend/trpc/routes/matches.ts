import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../create-context';
import { getDatabase, generateId } from '../../db/database';
import { canSetResult } from '../../utils/scoring';

export const matchesRouter = createTRPCRouter({
  listByTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDatabase();
      
      const matches = db.matches
        .filter(m => m.tournamentId === input.tournamentId)
        .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());

      return matches.map(match => {
        const team1 = db.teams.find(t => t.id === match.team1Id);
        const team2 = db.teams.find(t => t.id === match.team2Id);
        const prediction = db.predictions.find(
          p => p.matchId === match.id && p.userId === ctx.user.id
        );
        const bonusUsage = db.bonusUsages.find(
          bu => bu.matchId === match.id && bu.userId === ctx.user.id
        );
        const isFavoriteTeamMatch = 
          ctx.user.favoriteTeamId === match.team1Id || 
          ctx.user.favoriteTeamId === match.team2Id;

        return {
          ...match,
          team1: team1!,
          team2: team2!,
          prediction,
          bonusUsage,
          isFavoriteTeamMatch,
        };
      });
    }),

  create: adminProcedure
    .input(z.object({
      tournamentId: z.string(),
      startDatetime: z.string(),
      team1Id: z.string(),
      team2Id: z.string(),
      stage: z.enum(['NORMAL', 'SEMIFINAL', 'FINAL']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();

      const tournament = db.tournaments.find(t => t.id === input.tournamentId);
      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tournament not found' });
      }

      if (input.team1Id === input.team2Id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Teams must be different' });
      }

      const tournamentTeamIds = db.tournamentTeams
        .filter(tt => tt.tournamentId === input.tournamentId)
        .map(tt => tt.teamId);

      if (!tournamentTeamIds.includes(input.team1Id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Team 1 is not in tournament palette' });
      }

      if (!tournamentTeamIds.includes(input.team2Id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Team 2 is not in tournament palette' });
      }

      const newMatch = {
        id: generateId(),
        tournamentId: input.tournamentId,
        startDatetime: input.startDatetime,
        team1Id: input.team1Id,
        team2Id: input.team2Id,
        stage: input.stage,
        resultTeam1Goals: null,
        resultTeam2Goals: null,
        resultSetAt: null,
      };

      db.matches.push(newMatch);
      return newMatch;
    }),

  setResult: adminProcedure
    .input(z.object({
      matchId: z.string(),
      team1Goals: z.number().int().min(0),
      team2Goals: z.number().int().min(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const match = db.matches.find(m => m.id === input.matchId);

      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }

      if (!canSetResult(match)) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Cannot set result before 2 hours after match start' 
        });
      }

      match.resultTeam1Goals = input.team1Goals;
      match.resultTeam2Goals = input.team2Goals;
      match.resultSetAt = new Date().toISOString();

      return match;
    }),

  update: adminProcedure
    .input(z.object({
      matchId: z.string(),
      startDatetime: z.string().optional(),
      team1Id: z.string().optional(),
      team2Id: z.string().optional(),
      stage: z.enum(['NORMAL', 'SEMIFINAL', 'FINAL']).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const match = db.matches.find(m => m.id === input.matchId);

      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }

      if (match.resultSetAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot update match with result' });
      }

      const team1Id = input.team1Id || match.team1Id;
      const team2Id = input.team2Id || match.team2Id;

      if (team1Id === team2Id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Teams must be different' });
      }

      const tournamentTeamIds = db.tournamentTeams
        .filter(tt => tt.tournamentId === match.tournamentId)
        .map(tt => tt.teamId);

      if (input.team1Id && !tournamentTeamIds.includes(input.team1Id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Team 1 is not in tournament palette' });
      }

      if (input.team2Id && !tournamentTeamIds.includes(input.team2Id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Team 2 is not in tournament palette' });
      }

      if (input.startDatetime) match.startDatetime = input.startDatetime;
      if (input.team1Id) match.team1Id = input.team1Id;
      if (input.team2Id) match.team2Id = input.team2Id;
      if (input.stage) match.stage = input.stage;

      return match;
    }),

  delete: adminProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      
      const index = db.matches.findIndex(m => m.id === input.matchId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }

      db.matches.splice(index, 1);
      db.predictions = db.predictions.filter(p => p.matchId !== input.matchId);
      db.bonusUsages = db.bonusUsages.filter(bu => bu.matchId !== input.matchId);

      return { success: true };
    }),
});
