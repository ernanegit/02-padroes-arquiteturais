import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from '@/shared/utils/Logger';

export class ValidationMiddleware {
  private static logger = new Logger('ValidationMiddleware');

  // Validate request body
  static validate<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Parse and validate request body
        const validatedData = schema.parse(req.body);
        
        // Replace request body with validated data
        req.body = validatedData;
        
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, res);
      }
    };
  }

  // Validate query parameters
  static validateQuery<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Parse and validate query parameters
        const validatedQuery = schema.parse(req.query);
        
        // Replace request query with validated data
        req.query = validatedQuery as any;
        
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, res);
      }
    };
  }

  // Validate route parameters
  static validateParams<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Parse and validate route parameters
        const validatedParams = schema.parse(req.params);
        
        // Replace request params with validated data
        req.params = validatedParams as any;
        
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, res);
      }
    };
  }

  // Handle validation errors
  private static handleValidationError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));

      ValidationMiddleware.logger.warn('Validation failed:', { errors: validationErrors });

      res.status(400).json({
        error: 'Validation failed',
        message: 'The request data is invalid',
        details: validationErrors,
        timestamp: new Date().toISOString(),
      });
    } else {
      ValidationMiddleware.logger.error('Unexpected validation error:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Validate file uploads
  static validateFile(options: {
    required?: boolean;
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    fieldName?: string;
  }) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const {
        required = false,
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
        fieldName = 'file',
      } = options;

      const file = req.file || (req.files as any)?.[fieldName];

      // Check if file is required
      if (required && !file) {
        res.status(400).json({
          error: 'Validation failed',
          message: `File ${fieldName} is required`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Skip validation if file is not provided and not required
      if (!file) {
        next();
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        res.status(400).json({
          error: 'Validation failed',
          message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          error: 'Validation failed',
          message: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      ValidationMiddleware.logger.info(`File validated: ${file.originalname} (${file.size} bytes)`);
      next();
    };
  }

  // Custom validation function
  static custom<T>(
    validator: (data: any) => { isValid: boolean; error?: string; data?: T }
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const result = validator(req.body);

        if (!result.isValid) {
          res.status(400).json({
            error: 'Validation failed',
            message: result.error || 'The request data is invalid',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (result.data) {
          req.body = result.data;
        }

        next();
      } catch (error) {
        ValidationMiddleware.logger.error('Custom validation error:', error);

        res.status(500).json({
          error: 'Internal server error',
          message: 'An error occurred during validation',
          timestamp: new Date().toISOString(),
        });
      }
    };
  }
}