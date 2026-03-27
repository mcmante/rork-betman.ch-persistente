import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { getDatabase } from '../db/database';
import { AuthPayload, UserRole } from '../types';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  let auth: AuthPayload | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      auth = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as AuthPayload;
    } catch {
      auth = null;
    }
  }

  return {
    req: opts.req,
    auth,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  
  const db = await getDatabase();
  const user = db.users.find(u => u.id === ctx.auth!.userId);
  
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' });
  }

  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth,
      user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const playerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'PLAYER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Player access required' });
  }
  return next({ ctx });
});
