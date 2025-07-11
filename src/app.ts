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

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}