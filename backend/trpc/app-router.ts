import { createTRPCRouter } from './create-context';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { teamsRouter } from './routes/teams';
import { tournamentsRouter } from './routes/tournaments';
import { matchesRouter } from './routes/matches';
import { predictionsRouter } from './routes/predictions';
import { bonusRouter } from './routes/bonus';
import { shopRouter } from './routes/shop';
import { leaderboardRouter } from './routes/leaderboard';
import { configRouter } from './routes/config';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
  teams: teamsRouter,
  tournaments: tournamentsRouter,
  matches: matchesRouter,
  predictions: predictionsRouter,
  bonus: bonusRouter,
  shop: shopRouter,
  leaderboard: leaderboardRouter,
  config: configRouter,
});

export type AppRouter = typeof appRouter;
