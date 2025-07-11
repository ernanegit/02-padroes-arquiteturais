import { PrismaClient } from '@prisma/client';
import { IProductRepository } from '@/business/interfaces/IProductRepository';
import { Product } from '@/business/domain/Product';
import { Logger } from '@/shared/utils/Logger';

export class ProductRepository implements IProductRepository {
  private logger = new Logger('ProductRepository');

  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) return null;

      return new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error finding product by ID:', error);
      throw error;
    }
  }

  async findBySku(sku: string): Promise<Product | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { sku },
      });

      if (!product) return null;

      return new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error finding product by SKU:', error);
      throw error;
    }
  }

  async create(productData: Partial<Product>): Promise<Product> {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: productData.name!,
          description: productData.description!,
          price: productData.price!,
          sku: productData.sku!,
          stock: productData.stock!,
          categoryId: productData.categoryId!,
          isActive: productData.isActive ?? true,
        },
      });

      this.logger.info(`Product created: ${product.name} (SKU: ${product.sku})`);

      return new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async update(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(productData.name && { name: productData.name }),
          ...(productData.description && { description: productData.description }),
          ...(productData.price !== undefined && { price: productData.price }),
          ...(productData.sku && { sku: productData.sku }),
          ...(productData.stock !== undefined && { stock: productData.stock }),
          ...(productData.categoryId && { categoryId: productData.categoryId }),
          ...(productData.isActive !== undefined && { isActive: productData.isActive }),
        },
      });

      this.logger.info(`Product updated: ${product.name} (ID: ${id})`);

      return new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error updating product:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({
        where: { id },
      });

      this.logger.info(`Product deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;
      
      const products = await this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding all products:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { id: true },
      });

      return !!product;
    } catch (error) {
      this.logger.error('Error checking if product exists:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await this.prisma.product.count();
    } catch (error) {
      this.logger.error('Error counting products:', error);
      throw error;
    }
  }

  async findByCategory(categoryId: string, page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;
      
      const products = await this.prisma.product.findMany({
        where: { categoryId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding products by category:', error);
      throw error;
    }
  }

  async searchProducts(query: string, page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;
      
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error searching products:', error);
      throw error;
    }
  }

  async findActiveProducts(page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;
      
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding active products:', error);
      throw error;
    }
  }

  async findInStock(page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;
      
      const products = await this.prisma.product.findMany({
        where: { 
          stock: { gt: 0 },
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding products in stock:', error);
      throw error;
    }
  }

  async findByPriceRange(minPrice: number, maxPrice: number, page: number = 1, limit: number = 10): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;
      
      const products = await this.prisma.product.findMany({
        where: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { price: 'asc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding products by price range:', error);
      throw error;
    }
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: { stock: quantity },
      });

      this.logger.info(`Stock updated for product ${id}: ${quantity} units`);

      return new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (error) {
      this.logger.error('Error updating stock:', error);
      throw error;
    }
  }

  async findLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          stock: { lte: threshold },
          isActive: true,
        },
        orderBy: { stock: 'asc' },
      });

      return products.map(product => new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error finding low stock products:', error);
      throw error;
    }
  }
}