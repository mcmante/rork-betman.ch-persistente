import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../create-context';
import { getDatabase } from '../../db/database';
import { verifyPassword, hashPassword, validatePasswordPolicy } from '../../utils/password';
import { AuthPayload, UserPublic } from '../../types';

const createToken = (payload: AuthPayload): string => {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const sanitizeUser = (user: any): UserPublic => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  preferredLanguage: user.preferredLanguage,
  preferredTheme: user.preferredTheme,
  favoriteTeamId: user.favoriteTeamId,
  createdAt: user.createdAt,
});

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const user = db.users.find(u => u.username === input.username);

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      const token = createToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        token,
        user: sanitizeUser(user),
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return sanitizeUser(ctx.user);
  }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const user = db.users.find(u => u.id === ctx.user.id);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const isValid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
      }

      const validation = validatePasswordPolicy(input.newPassword);
      if (!validation.valid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: validation.errors.join(', ') });
      }

      user.passwordHash = await hashPassword(input.newPassword);
      return { success: true };
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      preferredLanguage: z.enum(['it', 'en']).optional(),
      preferredTheme: z.enum(['light', 'dark', 'system']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const user = db.users.find(u => u.id === ctx.user.id);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (input.preferredLanguage) {
        user.preferredLanguage = input.preferredLanguage;
      }
      if (input.preferredTheme) {
        user.preferredTheme = input.preferredTheme;
      }

      return sanitizeUser(user);
    }),

  setFavoriteTeam: protectedProcedure
    .input(z.object({
      teamId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const user = db.users.find(u => u.id === ctx.user.id);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (user.favoriteTeamId !== null) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Favorite team already set and cannot be changed' });
      }

      const team = db.teams.find(t => t.id === input.teamId);
      if (!team) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }

      user.favoriteTeamId = input.teamId;
      return sanitizeUser(user);
    }),
});
