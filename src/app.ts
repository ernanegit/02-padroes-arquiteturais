import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { Container } from '@/infrastructure/container/Container';
import { DatabaseConnection } from '@/infrastructure/database/DatabaseConnection';
import { RedisConnection } from '@/infrastructure/cache/RedisConnection';
import { Logger } from '@/shared/utils/Logger';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';

// Import routes
import { ProductRoutes } from '@/presentation/routes/ProductRoutes';
import { UserRoutes } from '@/presentation/routes/UserRoutes';
import { AuthRoutes } from '@/presentation/routes/AuthRoutes';
import { CartRoutes } from '@/presentation/routes/CartRoutes';
import { OrderRoutes } from '@/presentation/routes/OrderRoutes';
import { HealthRoutes } from '@/presentation/routes/HealthRoutes';

class Application {
  private app: express.Application;
  private container: Container;
  private logger: Logger;

  constructor() {
    this.app = express();
    this.container = new Container();
    this.logger = new Logger('Application');
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    }));
    
    // Compression
    this.app.use(compression());
    
    // Logging
    this.app.use(morgan('combined'));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = process.env.API_PREFIX || '/api/v1';
    
    // Health check (outside API prefix)
    this.app.use('/', new HealthRoutes(this.container).router);
    
    // API routes
    this.app.use(`${apiPrefix}/auth`, new AuthRoutes(this.container).router);
    this.app.use(`${apiPrefix}/users`, new UserRoutes(this.container).router);
    this.app.use(`${apiPrefix}/products`, new ProductRoutes(this.container).router);
    this.app.use(`${apiPrefix}/cart`, new CartRoutes(this.container).router);
    this.app.use(`${apiPrefix}/orders`, new OrderRoutes(this.container).router);
    
    // API documentation
    if (process.env.ENABLE_DOCS === 'true') {
      this.app.get('/docs', (req, res) => {
        res.json({
          title: 'E-commerce API',
          version: '1.0.0',
          description: 'Sistema de e-commerce demonstrando padrões arquiteturais',
          endpoints: {
            auth: `${apiPrefix}/auth`,
            users: `${apiPrefix}/users`,
            products: `${apiPrefix}/products`,
            cart: `${apiPrefix}/cart`,
            orders: `${apiPrefix}/orders`,
          },
          patterns: [
            'Layered Architecture',
            'MVC Pattern',
            'Repository Pattern',
            'Dependency Injection',
            'Hexagonal Architecture',
          ],
        });
      });
    }
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorHandler.handle);
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database connection
      await DatabaseConnection.connect();
      this.logger.info('Database connected successfully');

      // Initialize Redis connection
      await RedisConnection.connect();
      this.logger.info('Redis connected successfully');

      // Initialize dependency injection container
      await this.container.initialize();
      this.logger.info('Dependency injection container initialized');

      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    const port = process.env.PORT || 8000;
    
    this.app.listen(port, () => {
      this.logger.info(`🚀 Server running on port ${port}`);
      this.logger.info(`📋 Health check: http://localhost:${port}/health`);
      this.logger.info(`📊 API docs: http://localhost:${port}/docs`);
      this.logger.info(`🏗️  Environment: ${process.env.NODE_ENV}`);
    });
  }

  public async shutdown(): Promise<void> {
    try {
      await DatabaseConnection.disconnect();
      await RedisConnection.disconnect();
      this.logger.info('Application shutdown completed');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Application startup
async function bootstrap(): Promise<void> {
  const app = new Application();
  
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
  
  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📩 Received ${signal}, shutting down gracefully...`);
    
    try {
      await app.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start application
if (require.main === module) {
  bootstrap();
}

export default Application;