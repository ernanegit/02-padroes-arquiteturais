import { User, UserRole } from '@/business/domain/User';

export interface IUserRepository {
  // Basic CRUD operations
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: Partial<User>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  
  // Query operations
  findAll(page?: number, limit?: number): Promise<User[]>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
  
  // Search operations
  findByRole(role: UserRole, page?: number, limit?: number): Promise<User[]>;
  searchUsers(query: string, page?: number, limit?: number): Promise<User[]>;
  findActiveUsers(page?: number, limit?: number): Promise<User[]>;
}