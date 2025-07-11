import { Router } from 'express';
import { OrderController } from '@/presentation/controllers/OrderController';
import { Container } from '@/infrastructure/container/Container';
import { ValidationMiddleware } from '@/presentation/middlewares/ValidationMiddleware';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
import { UserRole } from '@/business/domain/User';
import { OrderStatus, PaymentStatus } from '@/business/domain/Order';
import { z } from 'zod';

// Create Order DTO
const CreateOrderDTO = z.object({
  cartItems: z
    .array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    }))
    .min(1, 'At least one cart item is required'),
  
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required').max(200, 'Street is too long'),
    city: z.string().min(1, 'City is required').max(100, 'City is too long'),
    state: z.string().min(1, 'State is required').max(100, 'State is too long'),
    zipCode: z.string().min(1, 'ZIP code is required').max(20, 'ZIP code is too long'),
    country: z.string().min(1, 'Country is required').max(100, 'Country is too long'),
  }),
});

// Update Order Status DTO
const UpdateOrderStatusDTO = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
});

// Update Payment Status DTO
const UpdatePaymentStatusDTO = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus, {
    errorMap: () => ({ message: 'Invalid payment status' }),
  }),
});

// Cancel Order DTO
const CancelOrderDTO = z.object({
  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional(),
});

// Order ID Parameter DTO
const OrderIdParamDTO = z.object({
  id: z
    .string()
    .min(1, 'Order ID is required')
    .trim(),
});

// Order Query DTO (for filtering and pagination)
const OrderQueryDTO = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .transform(Number)
    .refine((val) => val >= 1, 'Page must be at least 1')
    .optional()
    .default('1'),
  
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .transform(Number)
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('10'),
  
  status: z
    .nativeEnum(OrderStatus)
    .optional(),
  
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional(),
});

export class OrderRoutes {
  public router: Router;
  private orderController: OrderController;

  constructor(private container: Container) {
    this.router = Router();
    this.orderController = this.container.resolve<OrderController>('OrderController');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // All order routes require authentication
    this.router.use(AuthMiddleware.authenticate);

    // Customer routes - users can manage their own orders
    
    // GET /api/v1/orders - Get user's orders with pagination
    this.router.get(
      '/',
      ValidationMiddleware.validateQuery(OrderQueryDTO),
      this.orderController.getUserOrders
    );

    // GET /api/v1/orders/:id - Get specific order by ID
    this.router.get(
      '/:id',
      ValidationMiddleware.validateParams(OrderIdParamDTO),
      this.orderController.getOrderById
    );

    // POST /api/v1/orders - Create new order
    this.router.post(
      '/',
      ValidationMiddleware.validate(CreateOrderDTO),
      this.orderController.createOrder
    );

    // POST /api/v1/orders/:id/cancel - Cancel order (customer or admin)
    this.router.post(
      '/:id/cancel',
      ValidationMiddleware.validateParams(OrderIdParamDTO),
      ValidationMiddleware.validate(CancelOrderDTO),
      this.orderController.cancelOrder
    );

    // Admin/Moderator routes - order management
    
    // PATCH /api/v1/orders/:id/status - Update order status (admin/moderator only)
    this.router.patch(
      '/:id/status',
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateParams(OrderIdParamDTO),
      ValidationMiddleware.validate(UpdateOrderStatusDTO),
      this.orderController.updateOrderStatus
    );

    // PATCH /api/v1/orders/:id/payment - Update payment status (admin/moderator only)
    this.router.patch(
      '/:id/payment',
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateParams(OrderIdParamDTO),
      ValidationMiddleware.validate(UpdatePaymentStatusDTO),
      this.orderController.updatePaymentStatus
    );

    // GET /api/v1/orders/admin/summary - Get order summary/analytics (admin/moderator only)
    this.router.get(
      '/admin/summary',
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateQuery(OrderQueryDTO),
      this.orderController.getOrderSummary
    );
  }
}

// Export types for use in other files
export type CreateOrderDTO = z.infer<typeof CreateOrderDTO>;
export type UpdateOrderStatusDTO = z.infer<typeof UpdateOrderStatusDTO>;
export type UpdatePaymentStatusDTO = z.infer<typeof UpdatePaymentStatusDTO>;
export type CancelOrderDTO = z.infer<typeof CancelOrderDTO>;
export type OrderIdParamDTO = z.infer<typeof OrderIdParamDTO>;
export type OrderQueryDTO = z.infer<typeof OrderQueryDTO>;