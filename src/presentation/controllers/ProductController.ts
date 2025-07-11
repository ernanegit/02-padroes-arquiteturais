import { Request, Response } from 'express';
import { ProductService } from '@/business/services/ProductService';
import { Logger } from '@/shared/utils/Logger';

export class ProductController {
  private logger = new Logger('ProductController');

  constructor(private productService: ProductService) {}

  // GET /api/v1/products
  getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const activeOnly = req.query.active === 'true';

      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1 and limit must be between 1 and 100',
        });
        return;
      }

      const products = activeOnly 
        ? await this.productService.getActiveProducts(page, limit)
        : await this.productService.getAllProducts(page, limit);
      
      const totalProducts = await this.productService.getProductCount();
      const totalPages = Math.ceil(totalProducts / limit);

      res.json({
        data: products,
        pagination: {
          page,
          limit,
          total: totalProducts,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });

      this.logger.info(`Retrieved ${products.length} products for page ${page}`);
    } catch (error) {
      this.logger.error('Error getting all products:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve products',
      });
    }
  };

  // GET /api/v1/products/:id
  getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product ID is required',
        });
        return;
      }

      const product = await this.productService.getProductById(id);

      if (!product) {
        res.status(404).json({
          error: 'Product not found',
          message: `Product with ID ${id} does not exist`,
        });
        return;
      }

      res.json({
        data: product,
      });

      this.logger.info(`Retrieved product: ${product.name} (ID: ${id})`);
    } catch (error) {
      this.logger.error('Error getting product by ID:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve product',
      });
    }
  };

  // GET /api/v1/products/sku/:sku
  getProductBySku = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sku } = req.params;

      if (!sku) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product SKU is required',
        });
        return;
      }

      const product = await this.productService.getProductBySku(sku);

      if (!product) {
        res.status(404).json({
          error: 'Product not found',
          message: `Product with SKU ${sku} does not exist`,
        });
        return;
      }

      res.json({
        data: product,
      });

      this.logger.info(`Retrieved product by SKU: ${product.name} (SKU: ${sku})`);
    } catch (error) {
      this.logger.error('Error getting product by SKU:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve product',
      });
    }
  };

  // POST /api/v1/products
  createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await this.productService.createProduct(req.body);

      res.status(201).json({
        data: product,
        message: 'Product created successfully',
      });

      this.logger.info(`Product created: ${product.name} (SKU: ${product.sku})`);
    } catch (error) {
      this.logger.error('Error creating product:', error);

      if (error instanceof Error) {
        if (error.message.includes('Validation failed')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('already exists')) {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create product',
      });
    }
  };

  // PUT /api/v1/products/:id
  updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product ID is required',
        });
        return;
      }

      const product = await this.productService.updateProduct(id, req.body);

      res.json({
        data: product,
        message: 'Product updated successfully',
      });

      this.logger.info(`Product updated: ${product.name} (ID: ${id})`);
    } catch (error) {
      this.logger.error('Error updating product:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Product not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('Validation failed') || 
            error.message.includes('already exists')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update product',
      });
    }
  };

  // DELETE /api/v1/products/:id
  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product ID is required',
        });
        return;
      }

      await this.productService.deleteProduct(id);

      res.json({
        message: 'Product deleted successfully',
      });

      this.logger.info(`Product deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting product:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Product not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete product',
      });
    }
  };

  // GET /api/v1/products/search
  searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Search query is required',
        });
        return;
      }

      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1 and limit must be between 1 and 100',
        });
        return;
      }

      const products = await this.productService.searchProducts(query, page, limit);

      res.json({
        data: products,
        query: query,
        pagination: {
          page,
          limit,
          total: products.length,
        },
      });

      this.logger.info(`Product search: "${query}" - ${products.length} results`);
    } catch (error) {
      this.logger.error('Error searching products:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search products',
      });
    }
  };

  // GET /api/v1/products/category/:categoryId
  getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!categoryId) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Category ID is required',
        });
        return;
      }

      const products = await this.productService.getProductsByCategory(categoryId, page, limit);

      res.json({
        data: products,
        categoryId,
        pagination: {
          page,
          limit,
          total: products.length,
        },
      });

      this.logger.info(`Retrieved ${products.length} products for category ${categoryId}`);
    } catch (error) {
      this.logger.error('Error getting products by category:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve products',
      });
    }
  };

  // GET /api/v1/products/price-range
  getProductsByPriceRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const minPrice = parseFloat(req.query.min as string);
      const maxPrice = parseFloat(req.query.max as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(minPrice) || isNaN(maxPrice)) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Valid min and max price are required',
        });
        return;
      }

      const products = await this.productService.getProductsByPriceRange(minPrice, maxPrice, page, limit);

      res.json({
        data: products,
        priceRange: { min: minPrice, max: maxPrice },
        pagination: {
          page,
          limit,
          total: products.length,
        },
      });

      this.logger.info(`Retrieved ${products.length} products in price range ${minPrice}-${maxPrice}`);
    } catch (error) {
      this.logger.error('Error getting products by price range:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve products',
      });
    }
  };

  // GET /api/v1/products/low-stock
  getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;

      if (threshold < 0) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Threshold must be a positive number',
        });
        return;
      }

      const products = await this.productService.getLowStockProducts(threshold);

      res.json({
        data: products,
        threshold,
        count: products.length,
      });

      this.logger.info(`Retrieved ${products.length} low stock products (threshold: ${threshold})`);
    } catch (error) {
      this.logger.error('Error getting low stock products:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve low stock products',
      });
    }
  };

  // PATCH /api/v1/products/:id/stock
  updateStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product ID is required',
        });
        return;
      }

      if (quantity === undefined || quantity < 0) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Valid quantity is required (must be >= 0)',
        });
        return;
      }

      const product = await this.productService.updateStock(id, quantity);

      res.json({
        data: product,
        message: 'Stock updated successfully',
      });

      this.logger.info(`Stock updated for product ${id}: ${quantity} units`);
    } catch (error) {
      this.logger.error('Error updating stock:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Product not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update stock',
      });
    }
  };

  // POST /api/v1/products/:id/activate
  activateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product ID is required',
        });
        return;
      }

      const product = await this.productService.activateProduct(id);

      res.json({
        data: product,
        message: 'Product activated successfully',
      });

      this.logger.info(`Product activated: ${product.name} (ID: ${id})`);
    } catch (error) {
      this.logger.error('Error activating product:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Product not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to activate product',
      });
    }
  };

  // POST /api/v1/products/:id/deactivate
  deactivateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Product ID is required',
        });
        return;
      }

      const product = await this.productService.deactivateProduct(id);

      res.json({
        data: product,
        message: 'Product deactivated successfully',
      });

      this.logger.info(`Product deactivated: ${product.name} (ID: ${id})`);
    } catch (error) {
      this.logger.error('Error deactivating product:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Product not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to deactivate product',
      });
    }
  };
}