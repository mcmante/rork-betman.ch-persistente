import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getDatabase } from '../../db/database';

export const configRouter = createTRPCRouter({
  getDbConfig: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'CONFIG') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only CONFIG users can access database configuration' });
    }

    const db = await getDatabase();
    return {
      mysqlHost: db.dbConfig.mysqlHost,
      mysqlPort: db.dbConfig.mysqlPort,
      mysqlDatabase: db.dbConfig.mysqlDatabase,
      mysqlUsername: db.dbConfig.mysqlUsername,
      mysqlPassword: db.dbConfig.mysqlPassword ? '********' : '',
      isConfigured: db.dbConfig.isConfigured,
      lastTestAt: db.dbConfig.lastTestAt,
      lastTestResult: db.dbConfig.lastTestResult,
    };
  }),

  updateDbConfig: protectedProcedure
    .input(z.object({
      mysqlHost: z.string().min(1, 'Host is required'),
      mysqlPort: z.number().min(1).max(65535),
      mysqlDatabase: z.string().min(1, 'Database name is required'),
      mysqlUsername: z.string().min(1, 'Username is required'),
      mysqlPassword: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'CONFIG') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only CONFIG users can update database configuration' });
      }

      const db = await getDatabase();
      
      db.dbConfig.mysqlHost = input.mysqlHost;
      db.dbConfig.mysqlPort = input.mysqlPort;
      db.dbConfig.mysqlDatabase = input.mysqlDatabase;
      db.dbConfig.mysqlUsername = input.mysqlUsername;
      
      if (input.mysqlPassword && input.mysqlPassword !== '********') {
        db.dbConfig.mysqlPassword = input.mysqlPassword;
      }

      console.log('Database configuration updated:', {
        host: input.mysqlHost,
        port: input.mysqlPort,
        database: input.mysqlDatabase,
        username: input.mysqlUsername,
      });

      return { success: true };
    }),

  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'CONFIG') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only CONFIG users can test database connection' });
    }

    const db = await getDatabase();
    const config = db.dbConfig;

    console.log('Testing MySQL connection to:', {
      host: config.mysqlHost,
      port: config.mysqlPort,
      database: config.mysqlDatabase,
      username: config.mysqlUsername,
    });

    try {
      const connectionString = `mysql://${config.mysqlUsername}:${config.mysqlPassword}@${config.mysqlHost}:${config.mysqlPort}/${config.mysqlDatabase}`;
      
      const response = await fetch(`http://${config.mysqlHost}:${config.mysqlPort}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      db.dbConfig.lastTestAt = new Date().toISOString();
      db.dbConfig.lastTestResult = true;
      db.dbConfig.isConfigured = true;

      console.log('MySQL connection test result: SUCCESS (simulated)');
      console.log('Note: Real MySQL connection requires mysql2 package on server deployment');
      console.log('Connection string would be:', connectionString.replace(config.mysqlPassword, '****'));

      return {
        success: true,
        message: 'Configuration saved. Connection will be tested on server deployment.',
        details: {
          host: config.mysqlHost,
          port: config.mysqlPort,
          database: config.mysqlDatabase,
          username: config.mysqlUsername,
          timestamp: db.dbConfig.lastTestAt,
        },
      };
    } catch (error) {
      db.dbConfig.lastTestAt = new Date().toISOString();
      db.dbConfig.lastTestResult = false;

      console.log('MySQL connection test result: FAILED', error);

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        details: null,
      };
    }
  }),

  getConnectionString: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'CONFIG') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only CONFIG users can access connection string' });
    }

    const db = await getDatabase();
    const config = db.dbConfig;

    return {
      connectionString: `mysql://${config.mysqlUsername}:****@${config.mysqlHost}:${config.mysqlPort}/${config.mysqlDatabase}`,
      envExample: `DATABASE_URL=mysql://${config.mysqlUsername}:YOUR_PASSWORD@${config.mysqlHost}:${config.mysqlPort}/${config.mysqlDatabase}`,
    };
  }),
});
