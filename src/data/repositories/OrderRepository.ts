import { PrismaClient } from '@prisma/client';
import { IOrderRepository, OrderSummary } from '@/business/interfaces/IOrderRepository';
import { Order, OrderStatus, PaymentStatus, OrderItem, ShippingAddress } from '@/business/domain/Order';
import { Logger } from '@/shared/utils/Logger';

export class OrderRepository implements IOrderRepository {
  private logger = new Logger('OrderRepository');

  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!order) return null;

      return this.mapToOrder(order);
    } catch (error) {
      this.logger.error('Error finding order by ID:', error);
      throw error;
    }
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
        },
      });

      if (!order) return null;

      return this.mapToOrder(order);
    } catch (error) {
      this.logger.error('Error finding order by order number:', error);
      throw error;
    }
  }

  async create(orderData: Partial<Order>): Promise<Order> {
    try {
      const order = await this.prisma.order.create({
        data: {
          userId: orderData.userId!,
          orderNumber: orderData.orderNumber!,
          subtotal: orderData.subtotal!,
          shipping: orderData.shipping!,
          taxes: orderData.taxes!,
          total: orderData.total!,
          status: orderData.status!,
          paymentStatus: orderData.paymentStatus!,
          shippingAddress: orderData.shippingAddress! as any,
          items: {
            create: orderData.items!.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      this.logger.info(`Order created: ${order.orderNumber}`);
      return this.mapToOrder(order);
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  async update(id: string, orderData: Partial<Order>): Promise<Order> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: {
          ...(orderData.status && { status: orderData.status }),
          ...(orderData.paymentStatus && { paymentStatus: orderData.paymentStatus }),
          ...(orderData.shippedAt && { shippedAt: orderData.shippedAt }),
          ...(orderData.deliveredAt && { deliveredAt: orderData.deliveredAt }),
          updatedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      this.logger.info(`Order updated: ${order.orderNumber}`);
      return this.mapToOrder(order);
    } catch (error) {
      this.logger.error('Error updating order:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.order.delete({
        where: { id },
      });

      this.logger.info(`Order deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting order:', error);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      const skip = (page - 1) * limit;
      
      const orders = await this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding all orders:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        select: { id: true },
      });

      return !!order;
    } catch (error) {
      this.logger.error('Error checking if order exists:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await this.prisma.order.count();
    } catch (error) {
      this.logger.error('Error counting orders:', error);
      throw error;
    }
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      const skip = (page - 1) * limit;
      
      const orders = await this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding orders by user ID:', error);
      throw error;
    }
  }

  async findByStatus(status: OrderStatus, page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      const skip = (page - 1) * limit;
      
      const orders = await this.prisma.order.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding orders by status:', error);
      throw error;
    }
  }

  async findByPaymentStatus(paymentStatus: PaymentStatus, page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      const skip = (page - 1) * limit;
      
      const orders = await this.prisma.order.findMany({
        where: { paymentStatus },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding orders by payment status:', error);
      throw error;
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      const skip = (page - 1) * limit;
      
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding orders by date range:', error);
      throw error;
    }
  }

  async findPendingOrders(page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      return this.findByStatus(OrderStatus.PENDING, page, limit);
    } catch (error) {
      this.logger.error('Error finding pending orders:', error);
      throw error;
    }
  }

  async findRecentOrders(userId: string, limit: number = 5): Promise<Order[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding recent orders:', error);
      throw error;
    }
  }

  async findOrdersRequiringAction(page: number = 1, limit: number = 10): Promise<Order[]> {
    try {
      const skip = (page - 1) * limit;
      
      const orders = await this.prisma.order.findMany({
        where: {
          OR: [
            { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID },
            { status: OrderStatus.PROCESSING },
            { paymentStatus: PaymentStatus.FAILED },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          items: true,
        },
      });

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      this.logger.error('Error finding orders requiring action:', error);
      throw error;
    }
  }

  async getOrderSummary(startDate?: Date, endDate?: Date): Promise<OrderSummary> {
    try {
      const whereClause = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      const [totalOrders, orders, statusCounts] = await Promise.all([
        this.prisma.order.count({ where: whereClause }),
        this.prisma.order.findMany({
          where: whereClause,
          select: { total: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { _all: true },
        }),
      ]);

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const ordersByStatus = Object.values(OrderStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<OrderStatus, number>);

      statusCounts.forEach(item => {
        ordersByStatus[item.status as OrderStatus] = item._count._all;
      });

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
      };
    } catch (error) {
      this.logger.error('Error getting order summary:', error);
      throw error;
    }
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED],
          },
        },
        _sum: {
          total: true,
        },
      });

      return result._sum.total || 0;
    } catch (error) {
      this.logger.error('Error getting revenue by period:', error);
      throw error;
    }
  }

  async getOrderCountByStatus(): Promise<Record<OrderStatus, number>> {
    try {
      const statusCounts = await this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      });

      const result = Object.values(OrderStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<OrderStatus, number>);

      statusCounts.forEach(item => {
        result[item.status as OrderStatus] = item._count._all;
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting order count by status:', error);
      throw error;
    }
  }

  async getTopSellingProducts(limit: number = 10): Promise<Array<{ productId: string; productName: string; totalSold: number; revenue: number }>> {
    try {
      const result = await this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _sum: {
          quantity: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: limit,
      });

      return result.map(item => ({
        productId: item.productId,
        productName: item.productName,
        totalSold: item._sum.quantity || 0,
        revenue: item._sum.subtotal || 0,
      }));
    } catch (error) {
      this.logger.error('Error getting top selling products:', error);
      throw error;
    }
  }

  // Helper method to map Prisma result to Order domain object
  private mapToOrder(prismaOrder: any): Order {
    return new Order({
      id: prismaOrder.id,
      userId: prismaOrder.userId,
      orderNumber: prismaOrder.orderNumber,
      items: prismaOrder.items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })) || [],
      subtotal: prismaOrder.subtotal,
      shipping: prismaOrder.shipping,
      taxes: prismaOrder.taxes,
      total: prismaOrder.total,
      status: prismaOrder.status as OrderStatus,
      paymentStatus: prismaOrder.paymentStatus as PaymentStatus,
      shippingAddress: prismaOrder.shippingAddress as ShippingAddress,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
      shippedAt: prismaOrder.shippedAt,
      deliveredAt: prismaOrder.deliveredAt,
    });
  }
}