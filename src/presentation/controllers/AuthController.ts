import { Request, Response } from 'express';
import { AuthService } from '@/business/services/AuthService';
import { Logger } from '@/shared/utils/Logger';

export class AuthController {
  private logger = new Logger('AuthController');

  constructor(private authService: AuthService) {}

  // POST /api/v1/auth/login
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Email and password are required',
        });
        return;
      }

      const result = await this.authService.login(email, password);

      res.json({
        data: result,
        message: 'Login successful',
      });

      this.logger.info(`User logged in: ${email}`);
    } catch (error) {
      this.logger.error('Login error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid email or password',
          });
          return;
        }

        if (error.message.includes('deactivated')) {
          res.status(403).json({
            error: 'Account disabled',
            message: 'Your account has been deactivated',
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login',
      });
    }
  };

  // POST /api/v1/auth/logout
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      await this.authService.logout(userId, refreshToken);

      res.json({
        message: 'Logout successful',
      });

      this.logger.info(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error('Logout error:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to logout',
      });
    }
  };

  // POST /api/v1/auth/refresh
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      res.json({
        data: result,
        message: 'Token refreshed successfully',
      });

      this.logger.info('Access token refreshed');
    } catch (error) {
      this.logger.error('Token refresh error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid refresh token') || 
            error.message.includes('User not found')) {
          res.status(401).json({
            error: 'Invalid token',
            message: 'Invalid or expired refresh token',
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to refresh token',
      });
    }
  };

  // POST /api/v1/auth/change-password
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Current password and new password are required',
        });
        return;
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        message: 'Password changed successfully',
      });

      this.logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      this.logger.error('Change password error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Current password is incorrect')) {
          res.status(400).json({
            error: 'Validation error',
            message: 'Current password is incorrect',
          });
          return;
        }

        if (error.message.includes('User not found')) {
          res.status(404).json({
            error: 'User not found',
            message: 'User account not found',
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to change password',
      });
    }
  };

  // GET /api/v1/auth/me
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      res.json({
        data: user,
        message: 'User information retrieved successfully',
      });

      this.logger.debug(`Current user info requested: ${user.email}`);
    } catch (error) {
      this.logger.error('Get current user error:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user information',
      });
    }
  };

  // POST /api/v1/auth/verify-token
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Token is required',
        });
        return;
      }

      const payload = await this.authService.verifyToken(token);

      res.json({
        data: {
          valid: true,
          payload,
        },
        message: 'Token is valid',
      });

      this.logger.debug('Token verified successfully');
    } catch (error) {
      this.logger.error('Token verification error:', error);

      if (error instanceof Error) {
        if (error.message.includes('expired') || 
            error.message.includes('invalid') ||
            error.message.includes('User not found')) {
          res.status(401).json({
            error: 'Invalid token',
            message: 'Token is invalid or expired',
            data: {
              valid: false,
            },
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify token',
      });
    }
  };
}