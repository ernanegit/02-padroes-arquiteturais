import { Router } from 'express';
import { ProductController } from '@/presentation/controllers/ProductController';
import { Container } from '@/infrastructure/container/Container';
import { ValidationMiddleware } from '@/presentation/middlewares/ValidationMiddleware';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
import { UserRole } from '@/business/domain/User';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductQueryDTO,
  ProductSearchDTO,
  PriceRangeDTO,
  UpdateStockDTO,
  ProductIdDTO,
  ProductSkuDTO,
  CategoryIdDTO,
  LowStockQueryDTO,
} from '@/presentation/dtos/CreateProductDTO';

export class ProductRoutes {
  public router: Router;
  private productController: ProductController;

  constructor(private container: Container) {
    this.router = Router();
    this.productController = this.container.resolve<ProductController>('ProductController');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public routes (read-only access)
    this.router.get(
      '/',
      ValidationMiddleware.validateQuery(ProductQueryDTO),
      this.productController.getAllProducts
    );

    this.router.get(
      '/search',
      ValidationMiddleware.validateQuery(ProductSearchDTO),
      this.productController.searchProducts
    );

    this.router.get(
      '/price-range',
      ValidationMiddleware.validateQuery(PriceRangeDTO),
      this.productController.getProductsByPriceRange
    );

    this.router.get(
      '/category/:categoryId',
      ValidationMiddleware.validateParams(CategoryIdDTO),
      ValidationMiddleware.validateQuery(ProductQueryDTO),
      this.productController.getProductsByCategory
    );

    this.router.get(
      '/sku/:sku',
      ValidationMiddleware.validateParams(ProductSkuDTO),
      this.productController.getProductBySku
    );

    this.router.get(
      '/:id',
      ValidationMiddleware.validateParams(ProductIdDTO),
      this.productController.getProductById
    );

    // Protected routes - require authentication and admin/moderator privileges
    this.router.get(
      '/admin/low-stock',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateQuery(LowStockQueryDTO),
      this.productController.getLowStockProducts
    );

    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validate(CreateProductDTO),
      this.productController.createProduct
    );

    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateParams(ProductIdDTO),
      ValidationMiddleware.validate(UpdateProductDTO),
      this.productController.updateProduct
    );

    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(ProductIdDTO),
      this.productController.deleteProduct
    );

    this.router.patch(
      '/:id/stock',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateParams(ProductIdDTO),
      ValidationMiddleware.validate(UpdateStockDTO),
      this.productController.updateStock
    );

    this.router.post(
      '/:id/activate',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateParams(ProductIdDTO),
      this.productController.activateProduct
    );

    this.router.post(
      '/:id/deactivate',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateParams(ProductIdDTO),
      this.productController.deactivateProduct
    );
  }
}