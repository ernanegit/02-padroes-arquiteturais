import { RedisClientType } from 'redis';
import { IOrderRepository } from '@/business/interfaces/IOrderRepository';
import { IProductRepository } from '@/business/interfaces/IProductRepository';
import { IUserRepository } from '@/business/interfaces/IUserRepository';
import { Order, OrderStatus, PaymentStatus, OrderItem, ShippingAddress } from '@/business/domain/Order';
import { Cart } from '@/business/domain/Cart';
import { Logger } from '@/shared/utils/Logger';

// Temporary error classes until AppError is implemented
class OrderError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'OrderError';
  }

  static notFound(message: string): OrderError {
    return new OrderError(message, 404);
  }

  static validation(message: string): OrderError {
    return new OrderError(message, 400);
  }

  static businessLogic(message: string): OrderError {
    return new OrderError(message, 400);
  }

  static internal(message: string): OrderError {
    return new OrderError(message, 500);
  }
}

export interface CreateOrderRequest {
  userId: string;
  cartItems: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export class OrderService {
  private logger = new Logger('OrderService');
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private orderRepository: IOrderRepository,
    private productRepository: IProductRepository,
    private userRepository: IUserRepository,
    private redis: RedisClientType
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      this.logger.info(`Creating order for user: ${request.userId}`);

      // Validate user exists
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        throw OrderError.notFound('User not found');
      }

      if (!user.isActive) {
        throw OrderError.businessLogic('User account is inactive');
      }

      // Validate cart items
      if (!request.cartItems || request.cartItems.length === 0) {
        throw OrderError.validation('Order must contain at least one item');
      }

      // Validate and prepare order items
      const orderItems: OrderItem[] = [];
      let subtotal = 0;

      for (const cartItem of request.cartItems) {
        if (cartItem.quantity <= 0) {
          throw OrderError.validation(`Invalid quantity for product ${cartItem.productId}`);
        }

        // Get product details
        const product = await this.productRepository.findById(cartItem.productId);
        if (!product) {
          throw OrderError.notFound(`Product ${cartItem.productId} not found`);
        }

        if (!product.isActive) {
          throw OrderError.businessLogic(`Product ${product.name} is not available`);
        }

        // Check stock availability
        if (!product.canFulfillQuantity(cartItem.quantity)) {
          throw OrderError.businessLogic(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
          );
        }

        // Create order item
        const orderItem: OrderItem = {
          id: Math.random().toString(36).substring(2, 15),
          productId: product.id,
          productName: product.name,
          quantity: cartItem.quantity,
          unitPrice: product.price,
          subtotal: product.price * cartItem.quantity,
        };

        orderItems.push(orderItem);
        subtotal += orderItem.subtotal;
      }

      // Calculate totals
      const taxes = subtotal * 0.1; // 10% tax
      const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const total = subtotal + taxes + shipping;

      // Create order
      const orderData: Partial<Order> = {
        userId: request.userId,
        items: orderItems,
        subtotal,
        shipping,
        taxes,
        total,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddress: request.shippingAddress,
      };

      const order = new Order(orderData);

      // Validate order
      const validationErrors = order.validate();
      if (validationErrors.length > 0) {
        throw OrderError.validation(`Order validation failed: ${validationErrors.join(', ')}`);
      }

      // Save order
      const createdOrder = await this.orderRepository.create(order);

      // Reserve stock (reduce product stock)
      for (const orderItem of orderItems) {
        const product = await this.productRepository.findById(orderItem.productId);
        if (product) {
          product.reduceStock(orderItem.quantity);
          await this.productRepository.update(product.id, product);
        }
      }

      // Clear cache
      await this.clearOrdersCache();

      this.logger.info(`Order created successfully: ${createdOrder.orderNumber}`);
      return createdOrder;
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      // Try cache first
      const cacheKey = `order:${id}`;
      const cachedOrder = await this.redis.get(cacheKey);
      
      if (cachedOrder) {
        this.logger.debug(`Order found in cache: ${id}`);
        return new Order(JSON.parse(cachedOrder));
      }

      // Get from database
      const order = await this.orderRepository.findById(id);
      
      if (order) {
        // Cache order
        await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(order));
        this.logger.debug(`Order cached: ${id}`);
      }

      return order;
    } catch (error) {
      this.logger.error('Error getting order by ID:', error);
      throw error;
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      return await this.orderRepository.findByOrderNumber(orderNumber);
    } catch (error) {
      this.logger.error('Error getting order by number:', error);
      throw error;
    }
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw OrderError.notFound('User not found');
      }

      // Try cache first
      const cacheKey = `user:${userId}:orders:page:${page}:limit:${limit}`;
      const cachedOrders = await this.redis.get(cacheKey);
      
      if (cachedOrders) {
        this.logger.debug(`User orders found in cache: ${userId}`);
        return JSON.parse(cachedOrders).map((o: any) => new Order(o));
      }

      // Get from database
      const orders = await this.orderRepository.findByUserId(userId, page, limit);

      // Cache orders
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(orders));
      this.logger.debug(`User orders cached: ${userId}`);

      return orders;
    } catch (error) {
      this.logger.error('Error getting user orders:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw OrderError.notFound('Order not found');
      }

      // Apply business logic based on status transition
      switch (status) {
        case OrderStatus.CONFIRMED:
          order.confirm();
          break;
        case OrderStatus.PROCESSING:
          order.process();
          break;
        case OrderStatus.SHIPPED:
          order.ship();
          break;
        case OrderStatus.DELIVERED:
          order.deliver();
          break;
        case OrderStatus.CANCELLED:
          order.cancel();
          // Restore stock
          await this.restoreStock(order);
          break;
        default:
          throw OrderError.validation(`Invalid status transition: ${status}`);
      }

      // Update order
      const updatedOrder = await this.orderRepository.update(id, order);

      // Clear cache
      await this.clearOrderCache(id);
      await this.clearOrdersCache();

      this.logger.info(`Order status updated: ${order.orderNumber} -> ${status}`);
      return updatedOrder;
    } catch (error) {
      this.logger.error('Error updating order status:', error);
      throw error;
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw OrderError.notFound('Order not found');
      }

      // Apply business logic based on payment status
      switch (paymentStatus) {
        case PaymentStatus.PAID:
          order.markAsPaid();
          // Auto-confirm order when payment is successful
          if (order.status === OrderStatus.PENDING) {
            order.confirm();
          }
          break;
        case PaymentStatus.FAILED:
          order.markPaymentFailed();
          break;
        case PaymentStatus.REFUNDED:
          order.refund();
          // Restore stock for refunded orders
          await this.restoreStock(order);
          break;
        default:
          throw OrderError.validation(`Invalid payment status: ${paymentStatus}`);
      }

      // Update order
      const updatedOrder = await this.orderRepository.update(id, order);

      // Clear cache
      await this.clearOrderCache(id);
      await this.clearOrdersCache();

      this.logger.info(`Payment status updated: ${order.orderNumber} -> ${paymentStatus}`);
      return updatedOrder;
    } catch (error) {
      this.logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw OrderError.notFound('Order not found');
      }

      if (!order.canBeCancelled()) {
        throw OrderError.businessLogic('Order cannot be cancelled in its current status');
      }

      // Cancel order
      order.cancel();

      // Restore stock
      await this.restoreStock(order);

      // Update order
      const updatedOrder = await this.orderRepository.update(id, order);

      // Clear cache
      await this.clearOrderCache(id);
      await this.clearOrdersCache();

      this.logger.info(`Order cancelled: ${order.orderNumber}${reason ? ` - Reason: ${reason}` : ''}`);
      return updatedOrder;
    } catch (error) {
      this.logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status: OrderStatus, page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      // Try cache first
      const cacheKey = `orders:status:${status}:page:${page}:limit:${limit}`;
      const cachedOrders = await this.redis.get(cacheKey);
      
      if (cachedOrders) {
        this.logger.debug(`Orders by status found in cache: ${status}`);
        return JSON.parse(cachedOrders).map((o: any) => new Order(o));
      }

      // Get from database
      const orders = await this.orderRepository.findByStatus(status, page, limit);

      // Cache orders
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(orders));
      this.logger.debug(`Orders by status cached: ${status}`);

      return orders;
    } catch (error) {
      this.logger.error('Error getting orders by status:', error);
      throw error;
    }
  }

  async getOrderSummary(startDate?: Date, endDate?: Date): Promise<OrderSummary> {
    try {
      // Try cache first
      const dateKey = startDate && endDate ? `${startDate.toISOString()}-${endDate.toISOString()}` : 'all';
      const cacheKey = `orders:summary:${dateKey}`;
      const cachedSummary = await this.redis.get(cacheKey);
      
      if (cachedSummary) {
        this.logger.debug('Order summary found in cache');
        return JSON.parse(cachedSummary);
      }

      // Get summary from database
      const summary = await this.orderRepository.getOrderSummary(startDate, endDate);

      // Cache summary
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(summary));
      this.logger.debug('Order summary cached');

      return summary;
    } catch (error) {
      this.logger.error('Error getting order summary:', error);
      throw error;
    }
  }

  async createOrderFromCart(userId: string, cartId: string, shippingAddress: ShippingAddress): Promise<Order> {
    try {
      // This method would integrate with CartService
      // For now, throwing not implemented error
      throw OrderError.internal('Cart integration not implemented yet');
    } catch (error) {
      this.logger.error('Error creating order from cart:', error);
      throw error;
    }
  }

  // Private helper methods
  private async restoreStock(order: Order): Promise<void> {
    try {
      for (const item of order.items) {
        const product = await this.productRepository.findById(item.productId);
        if (product) {
          product.increaseStock(item.quantity);
          await this.productRepository.update(product.id, product);
        }
      }
      this.logger.info(`Stock restored for order: ${order.orderNumber}`);
    } catch (error) {
      this.logger.error('Error restoring stock:', error);
      // Don't throw here as it's a cleanup operation
    }
  }

  // Cache management
  private async clearOrderCache(id: string): Promise<void> {
    try {
      await this.redis.del(`order:${id}`);
    } catch (error) {
      this.logger.warn('Error clearing order cache:', error);
    }
  }

  private async clearOrdersCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('orders:*');
      const userOrderKeys = await this.redis.keys('user:*:orders:*');
      const allKeys = [...keys, ...userOrderKeys];
      
      if (allKeys.length > 0) {
        await this.redis.del(allKeys);
      }
    } catch (error) {
      this.logger.warn('Error clearing orders cache:', error);
    }
  }
}