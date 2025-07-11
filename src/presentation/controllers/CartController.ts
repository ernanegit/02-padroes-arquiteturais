import { Request, Response } from 'express';
import { CartService } from '@/business/services/CartService';
import { Logger } from '@/shared/utils/Logger';

export class CartController {
  private logger = new Logger('CartController');

  constructor(private cartService: CartService) {}

  // GET /api/v1/cart
  getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      const cart = await this.cartService.getCartByUserId(userId);

      res.json({
        data: cart,
        message: 'Cart retrieved successfully',
      });

      this.logger.info(`Cart retrieved for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error getting cart:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve cart',
      });
    }
  };

  // POST /api/v1/cart/items
  addItemToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { productId, quantity } = req.body;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!productId || !quantity) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Product ID and quantity are required',
        });
        return;
      }

      if (quantity <= 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Quantity must be positive',
        });
        return;
      }

      const cart = await this.cartService.addItemToCart(userId, productId, quantity);

      res.json({
        data: cart,
        message: 'Item added to cart successfully',
      });

      this.logger.info(`Item added to cart: ${productId} (quantity: ${quantity}) for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error adding item to cart:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Product not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('stock') || error.message.includes('quantity')) {
          res.status(400).json({
            error: 'Stock error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to add item to cart',
      });
    }
  };

  // PUT /api/v1/cart/items/:productId
  updateCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!productId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Product ID is required',
        });
        return;
      }

      if (quantity === undefined || quantity < 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid quantity is required (must be >= 0)',
        });
        return;
      }

      const cart = await this.cartService.updateCartItemQuantity(userId, productId, quantity);

      res.json({
        data: cart,
        message: 'Cart item updated successfully',
      });

      this.logger.info(`Cart item updated: ${productId} (quantity: ${quantity}) for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error updating cart item:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Item not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('stock')) {
          res.status(400).json({
            error: 'Stock error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update cart item',
      });
    }
  };

  // DELETE /api/v1/cart/items/:productId
  removeCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { productId } = req.params;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!productId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Product ID is required',
        });
        return;
      }

      const cart = await this.cartService.removeItemFromCart(userId, productId);

      res.json({
        data: cart,
        message: 'Item removed from cart successfully',
      });

      this.logger.info(`Item removed from cart: ${productId} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error removing cart item:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Item not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to remove cart item',
      });
    }
  };

  // DELETE /api/v1/cart
  clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      const cart = await this.cartService.clearCart(userId);

      res.json({
        data: cart,
        message: 'Cart cleared successfully',
      });

      this.logger.info(`Cart cleared for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error clearing cart:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to clear cart',
      });
    }
  };

  // GET /api/v1/cart/summary
  getCartSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      const summary = await this.cartService.getCartSummary(userId);

      res.json({
        data: summary,
        message: 'Cart summary retrieved successfully',
      });

      this.logger.info(`Cart summary retrieved for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error getting cart summary:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve cart summary',
      });
    }
  };
}