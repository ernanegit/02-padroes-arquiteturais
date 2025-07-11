import { Request, Response } from 'express';
import { OrderService } from '@/business/services/OrderService';
import { OrderStatus, PaymentStatus } from '@/business/domain/Order';
import { Logger } from '@/shared/utils/Logger';

export class OrderController {
  private logger = new Logger('OrderController');

  constructor(private orderService: OrderService) {}

  // GET /api/v1/orders
  getUserOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
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

      const orders = await this.orderService.getUserOrders(userId, page, limit);

      res.json({
        data: orders,
        pagination: {
          page,
          limit,
          total: orders.length,
        },
      });

      this.logger.info(`Retrieved ${orders.length} orders for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error getting user orders:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve orders',
      });
    }
  };

  // GET /api/v1/orders/:id
  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Order ID is required',
        });
        return;
      }

      const order = await this.orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({
          error: 'Order not found',
          message: `Order with ID ${id} does not exist`,
        });
        return;
      }

      // Check if user owns the order or is admin/moderator
      if (order.userId !== userId && userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own orders',
        });
        return;
      }

      res.json({
        data: order,
      });

      this.logger.info(`Retrieved order: ${order.orderNumber} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error getting order by ID:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve order',
      });
    }
  };

  // POST /api/v1/orders
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { cartItems, shippingAddress } = req.body;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Cart items are required',
        });
        return;
      }

      if (!shippingAddress) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Shipping address is required',
        });
        return;
      }

      const order = await this.orderService.createOrder({
        userId,
        cartItems,
        shippingAddress,
      });

      res.status(201).json({
        data: order,
        message: 'Order created successfully',
      });

      this.logger.info(`Order created: ${order.orderNumber} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error creating order:', error);

      if (error instanceof Error) {
        if (error.message.includes('Validation failed') || 
            error.message.includes('Invalid') ||
            error.message.includes('Insufficient stock')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Resource not found',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create order',
      });
    }
  };

  // PATCH /api/v1/orders/:id/status
  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userRole = req.user?.role;

      // Only admins and moderators can update order status
      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          error: 'Access denied',
          message: 'Only admins and moderators can update order status',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Order ID is required',
        });
        return;
      }

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid order status is required',
        });
        return;
      }

      const order = await this.orderService.updateOrderStatus(id, status);

      res.json({
        data: order,
        message: 'Order status updated successfully',
      });

      this.logger.info(`Order status updated: ${order.orderNumber} -> ${status}`);
    } catch (error) {
      this.logger.error('Error updating order status:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Order not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('cannot be') || error.message.includes('Invalid')) {
          res.status(400).json({
            error: 'Business logic error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update order status',
      });
    }
  };

  // PATCH /api/v1/orders/:id/payment
  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const userRole = req.user?.role;

      // Only admins and moderators can update payment status
      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          error: 'Access denied',
          message: 'Only admins and moderators can update payment status',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Order ID is required',
        });
        return;
      }

      if (!paymentStatus || !Object.values(PaymentStatus).includes(paymentStatus)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid payment status is required',
        });
        return;
      }

      const order = await this.orderService.updatePaymentStatus(id, paymentStatus);

      res.json({
        data: order,
        message: 'Payment status updated successfully',
      });

      this.logger.info(`Payment status updated: ${order.orderNumber} -> ${paymentStatus}`);
    } catch (error) {
      this.logger.error('Error updating payment status:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Order not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('Invalid')) {
          res.status(400).json({
            error: 'Business logic error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update payment status',
      });
    }
  };

  // POST /api/v1/orders/:id/cancel
  cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Order ID is required',
        });
        return;
      }

      // Get order to check ownership
      const existingOrder = await this.orderService.getOrderById(id);
      if (!existingOrder) {
        res.status(404).json({
          error: 'Order not found',
          message: 'Order does not exist',
        });
        return;
      }

      // Check if user owns the order or is admin/moderator
      if (existingOrder.userId !== userId && userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          error: 'Access denied',
          message: 'You can only cancel your own orders',
        });
        return;
      }

      const order = await this.orderService.cancelOrder(id, reason);

      res.json({
        data: order,
        message: 'Order cancelled successfully',
      });

      this.logger.info(`Order cancelled: ${order.orderNumber} by user: ${userId}`);
    } catch (error) {
      this.logger.error('Error cancelling order:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Order not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('cannot be cancelled')) {
          res.status(400).json({
            error: 'Business logic error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cancel order',
      });
    }
  };

  // GET /api/v1/orders/admin/summary
  getOrderSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userRole = req.user?.role;

      // Only admins and moderators can access order summary
      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          error: 'Access denied',
          message: 'Only admins and moderators can access order summary',
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await this.orderService.getOrderSummary(startDate, endDate);

      res.json({
        data: summary,
        message: 'Order summary retrieved successfully',
      });

      this.logger.info('Order summary retrieved');
    } catch (error) {
      this.logger.error('Error getting order summary:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve order summary',
      });
    }
  };
}