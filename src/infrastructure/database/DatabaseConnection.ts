import { PrismaClient } from '@prisma/client';
import { Logger } from '@/shared/utils/Logger';

export class DatabaseConnection {
  private static instance: PrismaClient;
  private static logger = new Logger('DatabaseConnection');

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        DatabaseConnection.instance.$on('query', (e) => {
          DatabaseConnection.logger.debug('Database Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      DatabaseConnection.instance.$on('error', (e) => {
        DatabaseConnection.logger.error('Database Error:', e);
      });

      DatabaseConnection.instance.$on('warn', (e) => {
        DatabaseConnection.logger.warn('Database Warning:', e);
      });
    }

    return DatabaseConnection.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$connect();
      DatabaseConnection.logger.info('Database connected successfully');
    } catch (error) {
      DatabaseConnection.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      if (DatabaseConnection.instance) {
        await DatabaseConnection.instance.$disconnect();
        DatabaseConnection.logger.info('Database disconnected successfully');
      }
    } catch (error) {
      DatabaseConnection.logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      DatabaseConnection.logger.error('Database health check failed:', error);
      return false;
    }
  }
}