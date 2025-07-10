import { DatabaseConnection } from '@/infrastructure/database/DatabaseConnection';
import { RedisConnection } from '@/infrastructure/cache/RedisConnection';
import { Logger } from '@/shared/utils/Logger';

// Interfaces (Ports)
import { IUserRepository } from '@/business/interfaces/IUserRepository';
import { IProductRepository } from '@/business/interfaces/IProductRepository';

// Repository implementations (Adapters)
import { UserRepository } from '@/data/repositories/UserRepository';
import { ProductRepository } from '@/data/repositories/ProductRepository';

// Services
import { UserService } from '@/business/services/UserService';
import { ProductService } from '@/business/services/ProductService';
import { AuthService } from '@/business/services/AuthService';

// Controllers
import { UserController } from '@/presentation/controllers/UserController';
import { ProductController } from '@/presentation/controllers/ProductController';
import { AuthController } from '@/presentation/controllers/AuthController';

type ServiceFactory<T> = () => T;
type ServiceInstance<T> = T;

export class Container {
  private services = new Map<string, ServiceFactory<any>>();
  private instances = new Map<string, ServiceInstance<any>>();
  private logger = new Logger('Container');

  public async initialize(): Promise<void> {
    this.logger.info('Initializing dependency injection container...');

    // Register infrastructure services
    this.registerSingleton('DatabaseConnection', () => DatabaseConnection.getInstance());
    this.registerSingleton('RedisConnection', () => RedisConnection.getInstance());

    // Register repositories (Data Layer)
    this.registerSingleton<IUserRepository>('UserRepository', () => 
      new UserRepository(this.resolve('DatabaseConnection'))
    );
    
    this.registerSingleton<IProductRepository>('ProductRepository', () => 
      new ProductRepository(this.resolve('DatabaseConnection'))
    );

    // Register services (Business Layer)
    this.registerSingleton('UserService', () => 
      new UserService(
        this.resolve<IUserRepository>('UserRepository'),
        this.resolve('RedisConnection')
      )
    );

    this.registerSingleton('ProductService', () => 
      new ProductService(
        this.resolve<IProductRepository>('ProductRepository'),
        this.resolve('RedisConnection')
      )
    );

    this.registerSingleton('AuthService', () => 
      new AuthService(
        this.resolve<IUserRepository>('UserRepository'),
        this.resolve('RedisConnection')
      )
    );

    // Register controllers (Presentation Layer)
    this.registerTransient('UserController', () => 
      new UserController(this.resolve('UserService'))
    );

    this.registerTransient('ProductController', () => 
      new ProductController(this.resolve('ProductService'))
    );

    this.registerTransient('AuthController', () => 
      new AuthController(this.resolve('AuthService'))
    );

    this.logger.info('Dependency injection container initialized successfully');
  }

  // Register singleton service (single instance)
  public registerSingleton<T>(name: string, factory: ServiceFactory<T>): void {
    this.services.set(name, factory);
    this.logger.debug(`Registered singleton service: ${name}`);
  }

  // Register transient service (new instance every time)
  public registerTransient<T>(name: string, factory: ServiceFactory<T>): void {
    this.services.set(name, factory);
    this.logger.debug(`Registered transient service: ${name}`);
  }

  // Resolve service by name
  public resolve<T>(name: string): T {
    // Check if singleton instance already exists
    if (this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    // Get service factory
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Create instance
    const instance = factory();

    // Store singleton instances
    if (!name.includes('Controller')) { // Controllers are transient
      this.instances.set(name, instance);
    }

    this.logger.debug(`Resolved service: ${name}`);
    return instance;
  }

  // Check if service is registered
  public isRegistered(name: string): boolean {
    return this.services.has(name);
  }

  // Get all registered service names
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  // Clear all services (for testing)
  public clear(): void {
    this.services.clear();
    this.instances.clear();
    this.logger.debug('Container cleared');
  }

  // Health check
  public healthCheck(): { status: string; services: string[] } {
    return {
      status: 'healthy',
      services: this.getRegisteredServices(),
    };
  }
}