import { Product } from '@/business/domain/Product';

export interface IProductRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  create(productData: Partial<Product>): Promise<Product>;
  update(id: string, productData: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  
  // Query operations
  findAll(page?: number, limit?: number): Promise<Product[]>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
  
  // Search and filter operations
  findByCategory(categoryId: string, page?: number, limit?: number): Promise<Product[]>;
  searchProducts(query: string, page?: number, limit?: number): Promise<Product[]>;
  findActiveProducts(page?: number, limit?: number): Promise<Product[]>;
  findInStock(page?: number, limit?: number): Promise<Product[]>;
  findByPriceRange(minPrice: number, maxPrice: number, page?: number, limit?: number): Promise<Product[]>;
  
  // Stock operations
  updateStock(id: string, quantity: number): Promise<Product>;
  findLowStockProducts(threshold?: number): Promise<Product[]>;
}