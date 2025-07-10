import { RedisClientType } from 'redis';
import { IUserRepository } from '@/business/interfaces/IUserRepository';
import { User, UserRole } from '@/business/domain/User';
import { Logger } from '@/shared/utils/Logger';
import bcrypt from 'bcryptjs';

export class UserService {
  private logger = new Logger('UserService');
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private userRepository: IUserRepository,
    private redis: RedisClientType
  ) {}

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      // Validate user data
      const user = new User(userData);
      const validationErrors = user.validate();
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(user.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;

      // Create user
      const createdUser = await this.userRepository.create(user);

      // Clear users cache
      await this.clearUsersCache();

      this.logger.info(`User created successfully: ${createdUser.email}`);
      return createdUser;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      // Try cache first
      const cacheKey = `user:${id}`;
      const cachedUser = await this.redis.get(cacheKey);
      
      if (cachedUser) {
        this.logger.debug(`User found in cache: ${id}`);
        return new User(JSON.parse(cachedUser));
      }

      // Get from database
      const user = await this.userRepository.findById(id);
      
      if (user) {
        // Cache user
        await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(user));
        this.logger.debug(`User cached: ${id}`);
      }

      return user;
    } catch (error) {
      this.logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      this.logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Update user
      const updatedUser = await this.userRepository.update(id, userData);

      // Clear cache
      await this.clearUserCache(id);
      await this.clearUsersCache();

      this.logger.info(`User updated successfully: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Delete user
      await this.userRepository.delete(id);

      // Clear cache
      await this.clearUserCache(id);
      await this.clearUsersCache();

      this.logger.info(`User deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<User[]> {
    try {
      // Try cache first
      const cacheKey = `users:page:${page}:limit:${limit}`;
      const cachedUsers = await this.redis.get(cacheKey);
      
      if (cachedUsers) {
        this.logger.debug(`Users found in cache: page ${page}`);
        return JSON.parse(cachedUsers).map((u: any) => new User(u));
      }

      // Get from database
      const users = await this.userRepository.findAll(page, limit);

      // Cache users
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(users));
      this.logger.debug(`Users cached: page ${page}`);

      return users;
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    try {
      // Try cache first
      const cacheKey = 'users:count';
      const cachedCount = await this.redis.get(cacheKey);
      
      if (cachedCount) {
        return parseInt(cachedCount, 10);
      }

      // Get from database
      const count = await this.userRepository.count();

      // Cache count
      await this.redis.setEx(cacheKey, this.CACHE_TTL, count.toString());

      return count;
    } catch (error) {
      this.logger.error('Error getting user count:', error);
      throw error;
    }
  }

  async activateUser(id: string): Promise<User> {
    try {
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }

      user.activate();
      return await this.userRepository.update(id, user);
    } catch (error) {
      this.logger.error('Error activating user:', error);
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<User> {
    try {
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }

      user.deactivate();
      return await this.userRepository.update(id, user);
    } catch (error) {
      this.logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Cache management
  private async clearUserCache(id: string): Promise<void> {
    try {
      await this.redis.del(`user:${id}`);
    } catch (error) {
      this.logger.warn('Error clearing user cache:', error);
    }
  }

  private async clearUsersCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('users:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      this.logger.warn('Error clearing users cache:', error);
    }
  }
}