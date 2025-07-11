import { Router } from 'express';
import { CartController } from '@/presentation/controllers/CartController';
import { Container } from '@/infrastructure/container/Container';
import { ValidationMiddleware } from '@/presentation/middlewares/ValidationMiddleware';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
import { z } from 'zod';

// Cart Item DTO for adding items to cart
const AddCartItemDTO = z.object({
  productId: z
    .string()
    .min(1, 'Product ID is required')
    .trim(),
  
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
});

// Update Cart Item DTO for updating item quantities
const UpdateCartItemDTO = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative')
    .max(100, 'Quantity cannot exceed 100'),
});

// Product ID Parameter DTO
const ProductIdParamDTO = z.object({
  productId: z
    .string()
    .min(1, 'Product ID is required')
    .trim(),
});

export class CartRoutes {
  public router: Router;
  private cartController: CartController;

  constructor(private container: Container) {
    this.router = Router();
    this.cartController = this.container.resolve<CartController>('CartController');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // All cart routes require authentication
    this.router.use(AuthMiddleware.authenticate);

    // GET /api/v1/cart - Get user's cart
    this.router.get(
      '/',
      this.cartController.getCart
    );

    // GET /api/v1/cart/summary - Get cart summary with calculations
    this.router.get(
      '/summary',
      this.cartController.getCartSummary
    );

    // POST /api/v1/cart/items - Add item to cart
    this.router.post(
      '/items',
      ValidationMiddleware.validate(AddCartItemDTO),
      this.cartController.addItemToCart
    );

    // PUT /api/v1/cart/items/:productId - Update item quantity in cart
    this.router.put(
      '/items/:productId',
      ValidationMiddleware.validateParams(ProductIdParamDTO),
      ValidationMiddleware.validate(UpdateCartItemDTO),
      this.cartController.updateCartItem
    );

    // DELETE /api/v1/cart/items/:productId - Remove item from cart
    this.router.delete(
      '/items/:productId',
      ValidationMiddleware.validateParams(ProductIdParamDTO),
      this.cartController.removeCartItem
    );

    // DELETE /api/v1/cart - Clear entire cart
    this.router.delete(
      '/',
      this.cartController.clearCart
    );
  }
}

// Export types for use in other files
export type AddCartItemDTO = z.infer<typeof AddCartItemDTO>;
export type UpdateCartItemDTO = z.infer<typeof UpdateCartItemDTO>;
export type ProductIdParamDTO = z.infer<typeof ProductIdParamDTO>;