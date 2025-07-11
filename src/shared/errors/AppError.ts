export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    // Maintain proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common error types
  static validation(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.VALIDATION_ERROR, 400, true, details);
  }

  static authentication(message: string = 'Authentication required'): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION_ERROR, 401, true);
  }

  static authorization(message: string = 'Access denied'): AppError {
    return new AppError(message, ErrorType.AUTHORIZATION_ERROR, 403, true);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, ErrorType.NOT_FOUND_ERROR, 404, true);
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.CONFLICT_ERROR, 409, true, details);
  }

  static businessLogic(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.BUSINESS_LOGIC_ERROR, 400, true, details);
  }

  static externalService(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.EXTERNAL_SERVICE_ERROR, 502, true, details);
  }

  static database(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.DATABASE_ERROR, 500, true, details);
  }

  static internal(message: string = 'Internal server error', details?: any): AppError {
    return new AppError(message, ErrorType.INTERNAL_SERVER_ERROR, 500, true, details);
  }

  // Convert to JSON for API responses
  toJSON(): object {
    return {
      error: this.type,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.details && { details: this.details }),
    };
  }

  // Check if error is operational (safe to show to client)
  isOperationalError(): boolean {
    return this.isOperational;
  }

  // Get user-friendly error message
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION_ERROR:
        return 'The provided data is invalid. Please check your input and try again.';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Authentication is required. Please log in and try again.';
      case ErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ErrorType.CONFLICT_ERROR:
        return 'The operation conflicts with the current state of the resource.';
      case ErrorType.BUSINESS_LOGIC_ERROR:
        return this.message; // Business logic errors usually have user-friendly messages
      case ErrorType.EXTERNAL_SERVICE_ERROR:
        return 'An external service is currently unavailable. Please try again later.';
      case ErrorType.DATABASE_ERROR:
        return 'A database error occurred. Please try again later.';
      case ErrorType.INTERNAL_SERVER_ERROR:
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}