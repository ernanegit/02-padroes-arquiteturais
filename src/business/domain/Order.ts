export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  taxes: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;

  constructor(data: Partial<Order>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.orderNumber = data.orderNumber || this.generateOrderNumber();
    this.items = data.items || [];
    this.subtotal = data.subtotal || 0;
    this.shipping = data.shipping || 0;
    this.taxes = data.taxes || 0;
    this.total = data.total || 0;
    this.status = data.status || OrderStatus.PENDING;
    this.paymentStatus = data.paymentStatus || PaymentStatus.PENDING;
    this.shippingAddress = data.shippingAddress || {} as ShippingAddress;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.shippedAt = data.shippedAt;
    this.deliveredAt = data.deliveredAt;
  }

  // Business logic methods
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Only pending orders can be confirmed');
    }
    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  process(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new Error('Only confirmed orders can be processed');
    }
    this.status = OrderStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  ship(): void {
    if (this.status !== OrderStatus.PROCESSING) {
      throw new Error('Only processing orders can be shipped');
    }
    this.status = OrderStatus.SHIPPED;
    this.shippedAt = new Date();
    this.updatedAt = new Date();
  }

  deliver(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new Error('Only shipped orders can be delivered');
    }
    this.status = OrderStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }

  cancel(): void {
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.status)) {
      throw new Error('Cannot cancel order in current status');
    }
    this.status = OrderStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  markAsPaid(): void {
    this.paymentStatus = PaymentStatus.PAID;
    this.updatedAt = new Date();
  }

  markPaymentFailed(): void {
    this.paymentStatus = PaymentStatus.FAILED;
    this.updatedAt = new Date();
  }

  refund(): void {
    if (this.paymentStatus !== PaymentStatus.PAID) {
      throw new Error('Only paid orders can be refunded');
    }
    this.paymentStatus = PaymentStatus.REFUNDED;
    this.status = OrderStatus.REFUNDED;
    this.updatedAt = new Date();
  }

  calculateTotals(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.taxes = this.subtotal * 0.1; // 10% tax
    this.shipping = this.subtotal > 100 ? 0 : 10; // Free shipping over $100
    this.total = this.subtotal + this.taxes + this.shipping;
    this.updatedAt = new Date();
  }

  // Helper methods
  canBeCancelled(): boolean {
    return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.status);
  }

  canBeRefunded(): boolean {
    return this.paymentStatus === PaymentStatus.PAID && 
           [OrderStatus.DELIVERED, OrderStatus.SHIPPED].includes(this.status);
  }

  isCompleted(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  // Validation
  validate(): string[] {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (this.items.length === 0) {
      errors.push('Order must have at least one item');
    }

    if (!this.shippingAddress.street) {
      errors.push('Shipping address is required');
    }

    this.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be positive`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`);
      }
    });

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }
}