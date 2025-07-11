import { RedisClientType } from 'redis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '@/business/interfaces/IUserRepository';
import { User } from '@/business/domain/User';
import { Logger } from '@/shared/utils/Logger';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export class AuthService {
  private logger = new Logger('AuthService');
  private readonly ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
  private readonly REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';

  constructor(
    private userRepository: IUserRepository,
    private redis: RedisClientType
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Store refresh token in Redis
      await this.storeRefreshToken(user.id, refreshToken);

      this.logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRES,
      };
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      if (refreshToken) {
        await this.invalidateRefreshToken(userId, refreshToken);
      } else {
        // Remove all refresh tokens for user
        await this.invalidateAllRefreshTokens(userId);
      }

      this.logger.info(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.getJwtSecret()) as TokenPayload;

      // Check if refresh token exists in Redis
      const storedToken = await this.redis.get(`${this.REFRESH_TOKEN_PREFIX}${decoded.id}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get updated user data
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      const accessToken = this.generateAccessToken(tokenPayload);

      this.logger.info(`Access token refreshed for user: ${user.email}`);

      return {
        accessToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRES,
      };
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.userRepository.update(userId, { password: hashedNewPassword });

      // Invalidate all refresh tokens (force re-login)
      await this.invalidateAllRefreshTokens(userId);

      this.logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      this.logger.error('Password change failed:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as TokenPayload;

      // Verify user still exists and is active
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return decoded;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  }

  private generateAccessToken(payload: TokenPayload): string {
    try {
      // Usar any para evitar problemas de tipagem do JWT
      const token = jwt.sign(
        payload as any,
        this.getJwtSecret(),
        { expiresIn: this.ACCESS_TOKEN_EXPIRES } as any
      );
      return token as string;
    } catch (error) {
      this.logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  private generateRefreshToken(payload: TokenPayload): string {
    try {
      // Usar any para evitar problemas de tipagem do JWT
      const token = jwt.sign(
        payload as any,
        this.getJwtSecret(),
        { expiresIn: this.REFRESH_TOKEN_EXPIRES } as any
      );
      return token as string;
    } catch (error) {
      this.logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
    const expiresInSeconds = this.parseTimeToSeconds(this.REFRESH_TOKEN_EXPIRES);
    await this.redis.setEx(key, expiresInSeconds, refreshToken);
  }

  private async invalidateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
    const storedToken = await this.redis.get(key);
    
    if (storedToken === refreshToken) {
      await this.redis.del(key);
    }
  }

  private async invalidateAllRefreshTokens(userId: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
    await this.redis.del(key);
  }

  private parseTimeToSeconds(timeStr: string): number {
    if (!timeStr || typeof timeStr !== 'string') {
      return 3600; // 1 hour default
    }

    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // 1 hour default if format is invalid
    }

    const [, numStr, unit] = match;
    const num = parseInt(numStr, 10);
    
    if (isNaN(num) || num <= 0) {
      return 3600; // 1 hour default
    }
    
    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 60 * 60;
      case 'd': return num * 60 * 60 * 24;
      default: return 3600; // 1 hour default
    }
  }
}