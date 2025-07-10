import { Router, Request, Response } from 'express';
import { DatabaseConnection } from '@/infrastructure/database/DatabaseConnection';
import { RedisConnection } from '@/infrastructure/cache/RedisConnection';
import { Container } from '@/infrastructure/container/Container';

export class HealthRoutes {
  public router: Router;

  constructor(private container: Container) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/health', this.healthCheck);
    this.router.get('/health/detailed', this.detailedHealthCheck);
  }

  private healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const dbHealth = await DatabaseConnection.healthCheck();
      const redisHealth = await RedisConnection.healthCheck();

      const isHealthy = dbHealth && redisHealth;

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'ecommerce-api',
        version: '1.0.0',
        database: dbHealth ? 'connected' : 'disconnected',
        cache: redisHealth ? 'connected' : 'disconnected',
        patterns: [
          'Layered Architecture',
          'MVC Pattern',
          'Repository Pattern',
          'Dependency Injection',
          'Hexagonal Architecture',
        ],
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'ecommerce-api',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  private detailedHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now();

      // Check database
      const dbStart = Date.now();
      const dbHealth = await DatabaseConnection.healthCheck();
      const dbLatency = Date.now() - dbStart;

      // Check Redis
      const redisStart = Date.now();
      const redisHealth = await RedisConnection.healthCheck();
      const redisLatency = Date.now() - redisStart;

      const totalLatency = Date.now() - startTime;

      const checks = {
        database: {
          status: dbHealth ? 'healthy' : 'unhealthy',
          latency: `${dbLatency}ms`,
        },
        cache: {
          status: redisHealth ? 'healthy' : 'unhealthy',
          latency: `${redisLatency}ms`,
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
        uptime: `${Math.round(process.uptime())}s`,
      };

      const isHealthy = dbHealth && redisHealth;

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'ecommerce-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        totalLatency: `${totalLatency}ms`,
        checks,
        architecture: {
          patterns: [
            'Layered Architecture',
            'MVC Pattern',
            'Repository Pattern',
            'Dependency Injection',
            'Hexagonal Architecture',
          ],
          layers: [
            'Presentation Layer (Controllers, Routes, DTOs)',
            'Business Layer (Services, Use Cases, Domain)',
            'Data Layer (Repositories, Models, Database)',
            'Infrastructure Layer (Database, Cache, External APIs)',
          ],
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'ecommerce-api',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}