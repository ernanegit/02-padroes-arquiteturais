import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '@/business/interfaces/IUserRepository';
import { User, UserRole } from '@/business/domain/User';
import { Logger } from '@/shared/utils/Logger';

export class UserRepository implements IUserRepository {
  private logger = new Logger('UserRepository');

  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;

      return new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      return new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email!,
          password: userData.password!,
          firstName: userData.firstName!,
          lastName: userData.lastName!,
          role: userData.role || UserRole.CUSTOMER,
          isActive: userData.isActive ?? true,
        },
      });

      this.logger.info(`User created: ${user.email}`);

      return new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...(userData.email && { email: userData.email }),
          ...(userData.password && { password: userData.password }),
          ...(userData.firstName && { firstName: userData.firstName }),
          ...(userData.lastName && { lastName: userData.lastName }),
          ...(userData.role && { role: userData.role }),
          ...(userData.isActive !== undefined && { isActive: userData.isActive }),
        },
      });

      this.logger.info(`User updated: ${user.email}`);

      return new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.info(`User deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      
      const users = await this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return users.map((user: any) => new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding all users:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      this.logger.error('Error checking if user exists:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await this.prisma.user.count();
    } catch (error) {
      this.logger.error('Error counting users:', error);
      throw error;
    }
  }

  // New methods to match interface
  async findByRole(role: UserRole, page: number = 1, limit: number = 10): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      
      const users = await this.prisma.user.findMany({
        where: { role },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return users.map((user: any) => new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding users by role:', error);
      throw error;
    }
  }

  async searchUsers(query: string, page: number = 1, limit: number = 10): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return users.map((user: any) => new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error searching users:', error);
      throw error;
    }
  }

  async findActiveUsers(page: number = 1, limit: number = 10): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return users.map((user: any) => new User({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding active users:', error);
      throw error;
    }
  }
}