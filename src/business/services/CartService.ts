import { RedisClientType } from 'redis';
import { IProductRepository } from '@/business/interfaces/IProductRepository';
import { IUserRepository } from '@/business/interfaces/IUserRepository';
import { Cart, CartItem } from '@/business/domain/Cart';
import { Logger } from '@/shared/utils/Logger';

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  estimatedTotal: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

// Temporary error classes until AppError is implemented
class CartError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'CartError';
  }

  static notFound(message: string): CartError {
    return new CartError(message, 404);
  }

  static validation(message: string): CartError {
    return new CartError(message, 400);
  }

  static businessLogic(message: string): CartError {
    return new CartError(message, 400);
  }

  static internal(message: string): CartError {
    return new CartError(message, 500);
  }
}

export class CartService {
  private logger = new Logger('CartService');
  private readonly CART_TTL = 86400; // 24 hours
  private readonly CART_PREFIX = 'cart:';

  constructor(
    private productRepository: IProductRepository,
    private userRepository: IUserRepository,
    private redis: RedisClientType
  ) {}

  async getCartByUserId(userId: string): Promise<Cart> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw CartError.notFound('User not found');
      }

      // Try to get cart from Redis first
      const cacheKey = `${this.CART_PREFIX}${userId}`;
      const cachedCart = await this.redis.get(cacheKey);

      if (cachedCart) {
        const cart = new Cart(JSON.parse(cachedCart));
        this.logger.debug(`Cart found in cache for user: ${userId}`);
        return cart;
      }

      // Create empty cart if not found
      const newCart = new Cart({
        userId,
        items: [],
        total: 0,
        itemCount: 0,
      });

      // Cache the empty cart
      await this.cacheCart(newCart);
      
      this.logger.info(`New cart created for user: ${userId}`);
      return newCart;
    } catch (error) {
      this.logger.error('Error getting cart:', error);
      throw error;
    }
  }

  async addItemToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
    try {
      if (quantity <= 0) {
        throw CartError.validation('Quantity must be positive');
      }

      // Get current cart
      const cart = await this.getCartByUserId(userId);

      // Get product details
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw CartError.notFound('Product not found');
      }

      if (!product.isActive) {
        throw CartError.businessLogic('Product is not available');
      }

      // Check if adding this quantity would exceed available stock
      const existingItem = cart.items.find(item => item.productId === productId);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const totalQuantityRequested = currentQuantityInCart + quantity;

      if (!product.canFulfillQuantity(totalQuantityRequested)) {
        throw CartError.businessLogic(
          `Insufficient stock. Available: ${product.stock}, Requested: ${totalQuantityRequested}, Currently in cart: ${currentQuantityInCart}`
        );
      }

      // Add item to cart
      cart.addItem(productId, quantity, product.price);

      // Cache updated cart
      await this.cacheCart(cart);

      this.logger.info(`Item added to cart: ${productId} (qty: ${quantity}) for user: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  async updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    try {
      if (quantity < 0) {
        throw CartError.validation('Quantity cannot be negative');
      }

      // Get current cart
      const cart = await this.getCartByUserId(userId);

      // Check if item exists in cart
      const existingItem = cart.items.find(item => item.productId === productId);
      if (!existingItem) {
        throw CartError.notFound('Item not found in cart');
      }

      // If quantity is 0, remove item
      if (quantity === 0) {
        return this.removeItemFromCart(userId, productId);
      }

      // Get product to check stock
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw CartError.notFound('Product not found');
      }

      if (!product.canFulfillQuantity(quantity)) {
        throw CartError.businessLogic(
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
        );
      }

      // Update quantity
      cart.updateItemQuantity(productId, quantity);

      // Cache updated cart
      await this.cacheCart(cart);

      this.logger.info(`Cart item updated: ${productId} (qty: ${quantity}) for user: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeItemFromCart(userId: string, productId: string): Promise<Cart> {
    try {
      // Get current cart
      const cart = await this.getCartByUserId(userId);

      // Check if item exists in cart
      const existingItem = cart.items.find(item => item.productId === productId);
      if (!existingItem) {
        throw CartError.notFound('Item not found in cart');
      }

      // Remove item
      cart.removeItem(productId);

      // Cache updated cart
      await this.cacheCart(cart);

      this.logger.info(`Item removed from cart: ${productId} for user: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error('Error removing item from cart:', error);
      throw error;
    }
  }

  async clearCart(userId: string): Promise<Cart> {
    try {
      // Get current cart
      const cart = await this.getCartByUserId(userId);

      // Clear all items
      cart.clear();

      // Cache updated cart
      await this.cacheCart(cart);

      this.logger.info(`Cart cleared for user: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const cart = await this.getCartByUserId(userId);

      if (cart.isEmpty()) {
        return {
          itemCount: 0,
          subtotal: 0,
          estimatedTotal: 0,
          items: [],
        };
      }

      // Get product details for each item
      const itemsWithDetails = await Promise.all(
        cart.items.map(async (item) => {
          const product = await this.productRepository.findById(item.productId);
          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.subtotal,
          };
        })
      );

      // Calculate estimated total (including taxes and shipping)
      const subtotal = cart.total;
      const taxes = subtotal * 0.1; // 10% tax
      const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const estimatedTotal = subtotal + taxes + shipping;

      return {
        itemCount: cart.itemCount,
        subtotal: subtotal,
        estimatedTotal: estimatedTotal,
        items: itemsWithDetails,
      };
    } catch (error) {
      this.logger.error('Error getting cart summary:', error);
      throw error;
    }
  }

  async validateCartForCheckout(userId: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const cart = await this.getCartByUserId(userId);
      const errors: string[] = [];

      if (cart.isEmpty()) {
        errors.push('Cart is empty');
        return { isValid: false, errors };
      }

      // Validate each item
      for (const item of cart.items) {
        const product = await this.productRepository.findById(item.productId);
        
        if (!product) {
          errors.push(`Product ${item.productId} no longer exists`);
          continue;
        }

        if (!product.isActive) {
          errors.push(`Product ${product.name} is no longer available`);
          continue;
        }

        if (!product.canFulfillQuantity(item.quantity)) {
          errors.push(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        // Check if price has changed
        if (Math.abs(item.price - product.price) > 0.01) {
          errors.push(
            `Price has changed for ${product.name}. Current: $${product.price}, Cart: $${item.price}`
          );
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error('Error validating cart for checkout:', error);
      throw error;
    }
  }

  async mergeGuestCart(userId: string, guestCartItems: CartItem[]): Promise<Cart> {
    try {
      const userCart = await this.getCartByUserId(userId);

      for (const guestItem of guestCartItems) {
        // Validate product exists
        const product = await this.productRepository.findById(guestItem.productId);
        if (!product || !product.isActive) {
          continue; // Skip invalid products
        }

        // Add to user cart (this will merge with existing items)
        userCart.addItem(guestItem.productId, guestItem.quantity, product.price);
      }

      // Cache updated cart
      await this.cacheCart(userCart);

      this.logger.info(`Guest cart merged for user: ${userId}`);
      return userCart;
    } catch (error) {
      this.logger.error('Error merging guest cart:', error);
      throw error;
    }
  }

  // Private helper methods
  private async cacheCart(cart: Cart): Promise<void> {
    try {
      const cacheKey = `${this.CART_PREFIX}${cart.userId}`;
      await this.redis.setEx(cacheKey, this.CART_TTL, JSON.stringify(cart));
    } catch (error) {
      this.logger.warn('Error caching cart:', error);
      // Don't throw here as caching is not critical
    }
  }

  private async clearCartCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${this.CART_PREFIX}${userId}`;
      await this.redis.del(cacheKey);
    } catch (error) {
      this.logger.warn('Error clearing cart cache:', error);
    }
  }
}