import { RedisClientType } from 'redis';
import { IProductRepository } from '@/business/interfaces/IProductRepository';
import { Product } from '@/business/domain/Product';
import { Logger } from '@/shared/utils/Logger';

export class ProductService {
  private logger = new Logger('ProductService');
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private productRepository: IProductRepository,
    private redis: RedisClientType
  ) {}

  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      // Validate product data
      const product = new Product(productData);
      const validationErrors = product.validate();
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Check if SKU already exists
      const existingProduct = await this.productRepository.findBySku(product.sku);
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }

      // Create product
      const createdProduct = await this.productRepository.create(product);

      // Clear products cache
      await this.clearProductsCache();

      this.logger.info(`Product created successfully: ${createdProduct.name} (SKU: ${createdProduct.sku})`);
      return createdProduct;
    } catch (error) {
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      // Try cache first
      const cacheKey = `product:${id}`;
      const cachedProduct = await this.redis.get(cacheKey);
      
      if (cachedProduct) {
        this.logger.debug(`Product found in cache: ${id}`);
        return new Product(JSON.parse(cachedProduct));
      }

      // Get from database
      const product = await this.productRepository.findById(id);
      
      if (product) {
        // Cache product
        await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(product));
        this.logger.debug(`Product cached: ${id}`);
      }

      return product;
    } catch (error) {
      this.logger.error('Error getting product by ID:', error);
      throw error;
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      // Try cache first
      const cacheKey = `product:sku:${sku}`;
      const cachedProduct = await this.redis.get(cacheKey);
      
      if (cachedProduct) {
        this.logger.debug(`Product found in cache by SKU: ${sku}`);
        return new Product(JSON.parse(cachedProduct));
      }

      // Get from database
      const product = await this.productRepository.findBySku(sku);
      
      if (product) {
        // Cache product
        await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(product));
        this.logger.debug(`Product cached by SKU: ${sku}`);
      }

      return product;
    } catch (error) {
      this.logger.error('Error getting product by SKU:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Check SKU uniqueness if being updated
      if (productData.sku && productData.sku !== existingProduct.sku) {
        const productWithSku = await this.productRepository.findBySku(productData.sku);
        if (productWithSku && productWithSku.id !== id) {
          throw new Error('Product with this SKU already exists');
        }
      }

      // Update product
      const updatedProduct = await this.productRepository.update(id, productData);

      // Clear cache
      await this.clearProductCache(id);
      await this.clearProductsCache();

      this.logger.info(`Product updated successfully: ${updatedProduct.name} (ID: ${id})`);
      return updatedProduct;
    } catch (error) {
      this.logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // Check if product exists
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Delete product
      await this.productRepository.delete(id);

      // Clear cache
      await this.clearProductCache(id);
      await this.clearProductsCache();

      this.logger.info(`Product deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async getAllProducts(page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      // Try cache first
      const cacheKey = `products:page:${page}:limit:${limit}`;
      const cachedProducts = await this.redis.get(cacheKey);
      
      if (cachedProducts) {
        this.logger.debug(`Products found in cache: page ${page}`);
        return JSON.parse(cachedProducts).map((p: any) => new Product(p));
      }

      // Get from database
      const products = await this.productRepository.findAll(page, limit);

      // Cache products
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(products));
      this.logger.debug(`Products cached: page ${page}`);

      return products;
    } catch (error) {
      this.logger.error('Error getting all products:', error);
      throw error;
    }
  }

  async getActiveProducts(page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      // Try cache first
      const cacheKey = `products:active:page:${page}:limit:${limit}`;
      const cachedProducts = await this.redis.get(cacheKey);
      
      if (cachedProducts) {
        this.logger.debug(`Active products found in cache: page ${page}`);
        return JSON.parse(cachedProducts).map((p: any) => new Product(p));
      }

      // Get from database
      const products = await this.productRepository.findActiveProducts(page, limit);

      // Cache products
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(products));
      this.logger.debug(`Active products cached: page ${page}`);

      return products;
    } catch (error) {
      this.logger.error('Error getting active products:', error);
      throw error;
    }
  }

  async searchProducts(query: string, page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      // Don't cache search results as they can be very specific
      const products = await this.productRepository.searchProducts(query, page, limit);
      
      this.logger.info(`Product search performed: "${query}" - ${products.length} results`);
      return products;
    } catch (error) {
      this.logger.error('Error searching products:', error);
      throw error;
    }
  }

  async getProductsByCategory(categoryId: string, page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      // Try cache first
      const cacheKey = `products:category:${categoryId}:page:${page}:limit:${limit}`;
      const cachedProducts = await this.redis.get(cacheKey);
      
      if (cachedProducts) {
        this.logger.debug(`Products by category found in cache: ${categoryId}`);
        return JSON.parse(cachedProducts).map((p: any) => new Product(p));
      }

      // Get from database
      const products = await this.productRepository.findByCategory(categoryId, page, limit);

      // Cache products
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(products));
      this.logger.debug(`Products by category cached: ${categoryId}`);

      return products;
    } catch (error) {
      this.logger.error('Error getting products by category:', error);
      throw error;
    }
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number, page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
        throw new Error('Invalid price range');
      }

      const products = await this.productRepository.findByPriceRange(minPrice, maxPrice, page, limit);
      
      this.logger.info(`Products by price range: ${minPrice}-${maxPrice} - ${products.length} results`);
      return products;
    } catch (error) {
      this.logger.error('Error getting products by price range:', error);
      throw error;
    }
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const products = await this.productRepository.findLowStockProducts(threshold);
      
      this.logger.info(`Low stock products (threshold: ${threshold}): ${products.length} products`);
      return products;
    } catch (error) {
      this.logger.error('Error getting low stock products:', error);
      throw error;
    }
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    try {
      if (quantity < 0) {
        throw new Error('Stock quantity cannot be negative');
      }

      const product = await this.productRepository.updateStock(id, quantity);

      // Clear cache
      await this.clearProductCache(id);
      await this.clearProductsCache();

      this.logger.info(`Stock updated for product ${id}: ${quantity} units`);
      return product;
    } catch (error) {
      this.logger.error('Error updating stock:', error);
      throw error;
    }
  }

  async activateProduct(id: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      product.activate();
      return await this.productRepository.update(id, product);
    } catch (error) {
      this.logger.error('Error activating product:', error);
      throw error;
    }
  }

  async deactivateProduct(id: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      product.deactivate();
      return await this.productRepository.update(id, product);
    } catch (error) {
      this.logger.error('Error deactivating product:', error);
      throw error;
    }
  }

  async getProductCount(): Promise<number> {
    try {
      // Try cache first
      const cacheKey = 'products:count';
      const cachedCount = await this.redis.get(cacheKey);
      
      if (cachedCount) {
        return parseInt(cachedCount, 10);
      }

      // Get from database
      const count = await this.productRepository.count();

      // Cache count
      await this.redis.setEx(cacheKey, this.CACHE_TTL, count.toString());

      return count;
    } catch (error) {
      this.logger.error('Error getting product count:', error);
      throw error;
    }
  }

  // Cache management
  private async clearProductCache(id: string): Promise<void> {
    try {
      await this.redis.del(`product:${id}`);
    } catch (error) {
      this.logger.warn('Error clearing product cache:', error);
    }
  }

  private async clearProductsCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('products:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      this.logger.warn('Error clearing products cache:', error);
    }
  }
}