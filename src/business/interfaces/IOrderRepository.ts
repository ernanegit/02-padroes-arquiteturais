import { Order, OrderStatus, PaymentStatus } from '@/business/domain/Order';

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export interface IOrderRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  create(orderData: Partial<Order>): Promise<Order>;
  update(id: string, orderData: Partial<Order>): Promise<Order>;
  delete(id: string): Promise<void>;
  
  // Query operations
  findAll(page?: number, limit?: number): Promise<Order[]>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
  
  // Search and filter operations
  findByUserId(userId: string, page?: number, limit?: number): Promise<Order[]>;
  findByStatus(status: OrderStatus, page?: number, limit?: number): Promise<Order[]>;
  findByPaymentStatus(paymentStatus: PaymentStatus, page?: number, limit?: number): Promise<Order[]>;
  findByDateRange(startDate: Date, endDate: Date, page?: number, limit?: number): Promise<Order[]>;
  
  // Business operations
  findPendingOrders(page?: number, limit?: number): Promise<Order[]>;
  findRecentOrders(userId: string, limit?: number): Promise<Order[]>;
  findOrdersRequiringAction(page?: number, limit?: number): Promise<Order[]>;
  
  // Analytics and reporting
  getOrderSummary(startDate?: Date, endDate?: Date): Promise<OrderSummary>;
  getRevenueByPeriod(startDate: Date, endDate: Date): Promise<number>;
  getOrderCountByStatus(): Promise<Record<OrderStatus, number>>;
  getTopSellingProducts(limit?: number): Promise<Array<{ productId: string; productName: string; totalSold: number; revenue: number }>>;
}