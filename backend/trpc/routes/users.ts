import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../create-context';
import { getDatabase, generateId } from '../../db/database';
import { hashPassword, validatePasswordPolicy } from '../../utils/password';
import { UserPublic } from '../../types';

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

export const usersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    const db = await getDatabase();
    return db.users.map(sanitizeUser);
  }),

  create: adminProcedure
    .input(z.object({
      username: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(1),
      role: z.enum(['ADMIN', 'PLAYER']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();

      if (db.users.some(u => u.username === input.username)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Username already exists' });
      }

      if (db.users.some(u => u.email === input.email)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already exists' });
      }

      const validation = validatePasswordPolicy(input.password);
      if (!validation.valid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: validation.errors.join(', ') });
      }

      const passwordHash = await hashPassword(input.password);

      const newUser = {
        id: generateId(),
        username: input.username,
        email: input.email,
        role: input.role,
        passwordHash,
        preferredLanguage: 'en' as const,
        preferredTheme: 'system' as const,
        favoriteTeamId: null,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      return sanitizeUser(newUser);
    }),

  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDatabase();
      
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete yourself' });
      }

      const index = db.users.findIndex(u => u.id === input.userId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      db.users.splice(index, 1);
      return { success: true };
    }),
});
