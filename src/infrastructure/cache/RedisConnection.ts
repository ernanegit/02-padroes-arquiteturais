import { createClient, RedisClientType } from 'redis';
import { Logger } from '@/shared/utils/Logger';

export class RedisConnection {
  private static instance: RedisClientType;
  private static logger = new Logger('RedisConnection');

  public static getInstance(): RedisClientType {
    if (!RedisConnection.instance) {
      RedisConnection.instance = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              RedisConnection.logger.error('Redis reconnection failed after 3 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      RedisConnection.instance.on('connect', () => {
        RedisConnection.logger.info('Redis client connected');
      });

      RedisConnection.instance.on('ready', () => {
        RedisConnection.logger.info('Redis client ready');
      });

      RedisConnection.instance.on('error', (error) => {
        RedisConnection.logger.error('Redis client error:', error);
      });

      RedisConnection.instance.on('end', () => {
        RedisConnection.logger.info('Redis client disconnected');
      });

      RedisConnection.instance.on('reconnecting', () => {
        RedisConnection.logger.warn('Redis client reconnecting...');
      });
    }

    return RedisConnection.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const client = RedisConnection.getInstance();
      if (!client.isOpen) {
        await client.connect();
      }
      RedisConnection.logger.info('Redis connected successfully');
    } catch (error) {
      RedisConnection.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      if (RedisConnection.instance && RedisConnection.instance.isOpen) {
        await RedisConnection.instance.quit();
        RedisConnection.logger.info('Redis disconnected successfully');
      }
    } catch (error) {
      RedisConnection.logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const client = RedisConnection.getInstance();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      RedisConnection.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Utility methods
  public static async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    const client = RedisConnection.getInstance();
    if (expireInSeconds) {
      await client.setEx(key, expireInSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  public static async get(key: string): Promise<string | null> {
    const client = RedisConnection.getInstance();
    return client.get(key);
  }

  public static async del(key: string): Promise<void> {
    const client = RedisConnection.getInstance();
    await client.del(key);
  }
}