import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '@/shared/utils/Logger';
import { UserRole } from '@/business/domain/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isActive: boolean;
      };
    }
  }
}

export class AuthMiddleware {
  private static logger = new Logger('AuthMiddleware');

  // Authenticate user using JWT
  static authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Authorization header is missing',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const token = AuthMiddleware.extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Invalid authorization header format',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (!decoded || !decoded.id) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid token payload',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Add user information to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isActive: decoded.isActive,
      };

      // Check if user is active
      if (!req.user.isActive) {
        res.status(403).json({
          error: 'Account disabled',
          message: 'Your account has been deactivated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      AuthMiddleware.logger.debug(`User authenticated: ${req.user.email}`);
      next();
    } catch (error) {
      AuthMiddleware.logger.warn('Authentication failed:', error);

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please login again',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Authorize user based on roles
  static authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          res.status(401).json({
            error: 'Authentication required',
            message: 'User information is missing from request',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
          AuthMiddleware.logger.warn(
            `Access denied for user ${req.user.email}. Required roles: ${allowedRoles.join(', ')}, User role: ${userRole}`
          );

          res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to access this resource',
            requiredRoles: allowedRoles,
            userRole: userRole,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        AuthMiddleware.logger.debug(`Access granted for user ${req.user.email} with role ${userRole}`);
        next();
      } catch (error) {
        AuthMiddleware.logger.error('Authorization error:', error);

        res.status(500).json({
          error: 'Authorization error',
          message: 'An error occurred during authorization',
          timestamp: new Date().toISOString(),
        });
      }
    };
  };

  // Optional authentication (doesn't fail if no token)
  static optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        next();
        return;
      }

      const token = AuthMiddleware.extractTokenFromHeader(authHeader);

      if (!token) {
        next();
        return;
      }

      // Try to verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded && decoded.id) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          isActive: decoded.isActive,
        };
      }

      next();
    } catch (error) {
      // Continue without authentication if token is invalid
      AuthMiddleware.logger.debug('Optional authentication failed, continuing without auth:', error);
      next();
    }
  };

  // Check if user owns resource or has admin privileges
  static ownerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User information is missing from request',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const resourceUserId = req.params.id || req.params.userId;
      const currentUserId = req.user.id;
      const userRole = req.user.role;

      // Allow if user is admin or owns the resource
      if (userRole === UserRole.ADMIN || currentUserId === resourceUserId) {
        next();
        return;
      }

      res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources or must be an admin',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      AuthMiddleware.logger.error('Owner/admin check error:', error);

      res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred during authorization',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Extract token from Authorization header
  private static extractTokenFromHeader(authHeader: string): string | null {
    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
}

// Completar o arquivo AuthMiddleware.ts existente que estava incompleto