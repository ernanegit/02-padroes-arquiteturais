import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorType } from '@/shared/errors/AppError';
import { Logger } from '@/shared/utils/Logger';
import { ZodError } from 'zod';

// Extend Express Request interface to include id
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  // Main error handling middleware
  static handle = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    ErrorHandler.logger.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id,
    });

    // Handle different types of errors
    if (error instanceof AppError) {
      ErrorHandler.handleAppError(error, res);
    } else if (error instanceof ZodError) {
      ErrorHandler.handleZodError(error, res);
    } else {
      ErrorHandler.handleGenericError(error, res);
    }
  };

  // Handle custom application errors
  private static handleAppError(error: AppError, res: Response): void {
    const response = {
      error: error.type,
      message: error.isOperational ? error.message : error.getUserMessage(),
      statusCode: error.statusCode,
      timestamp: error.timestamp.toISOString(),
      ...(error.details && error.isOperational && { details: error.details }),
    };

    // Don't expose internal details in production
    if (process.env.NODE_ENV === 'production' && !error.isOperational) {
      delete response.details;
    }

    res.status(error.statusCode).json(response);
  }

  // Handle Zod validation errors
  private static handleZodError(error: ZodError, res: Response): void {
    const validationErrors = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.input,
    }));

    res.status(400).json({
      error: ErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      details: validationErrors,
    });
  }

  // Handle generic/unexpected errors
  private static handleGenericError(error: Error, res: Response): void {
    // Check for specific error types and convert to AppError
    if (error.name === 'ValidationError') {
      ErrorHandler.handleAppError(
        AppError.validation(error.message),
        res
      );
      return;
    }

    if (error.name === 'CastError') {
      ErrorHandler.handleAppError(
        AppError.validation('Invalid data format'),
        res
      );
      return;
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      ErrorHandler.handleDatabaseError(error, res);
      return;
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      ErrorHandler.handlePrismaError(error as any, res);
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      ErrorHandler.handleAppError(
        AppError.authentication('Invalid token'),
        res
      );
      return;
    }

    if (error.name === 'TokenExpiredError') {
      ErrorHandler.handleAppError(
        AppError.authentication('Token has expired'),
        res
      );
      return;
    }

    // Default to internal server error
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      error: ErrorType.INTERNAL_SERVER_ERROR,
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: error.stack }),
    });
  }

  // Handle database errors
  private static handleDatabaseError(error: Error, res: Response): void {
    ErrorHandler.logger.error('Database error:', error);

    // Don't expose database details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const message = isDevelopment ? error.message : 'Database operation failed';

    ErrorHandler.handleAppError(
      AppError.database(message),
      res
    );
  }

  // Handle Prisma-specific errors
  private static handlePrismaError(error: any, res: Response): void {
    ErrorHandler.logger.error('Prisma error:', error);

    switch (error.code) {
      case 'P2002': // Unique constraint failed
        ErrorHandler.handleAppError(
          AppError.conflict('A record with this information already exists'),
          res
        );
        break;

      case 'P2025': // Record not found
        ErrorHandler.handleAppError(
          AppError.notFound('The requested record was not found'),
          res
        );
        break;

      case 'P2003': // Foreign key constraint failed
        ErrorHandler.handleAppError(
          AppError.validation('Invalid reference to related record'),
          res
        );
        break;

      case 'P2004': // Constraint failed
        ErrorHandler.handleAppError(
          AppError.validation('Data constraint violation'),
          res
        );
        break;

      default:
        ErrorHandler.handleDatabaseError(error, res);
    }
  }

  // Handle 404 errors (route not found)
  static notFound = (req: Request, res: Response): void => {
    res.status(404).json({
      error: ErrorType.NOT_FOUND_ERROR,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
  };

  // Handle async errors
  static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Graceful shutdown on unhandled errors
  static setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      ErrorHandler.logger.error('Uncaught Exception:', error);
      
      // Exit gracefully
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      ErrorHandler.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      // Exit gracefully
      process.exit(1);
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      ErrorHandler.logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', () => {
      ErrorHandler.logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }
}