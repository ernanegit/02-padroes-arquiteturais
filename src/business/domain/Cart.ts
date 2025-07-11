export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: Date;
}

export class Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Cart>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.items = data.items || [];
    this.total = data.total || 0;
    this.itemCount = data.itemCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Business logic methods
  addItem(productId: string, quantity: number, price: number): void {
    const existingItem = this.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      const newItem: CartItem = {
        id: Math.random().toString(36).substring(2, 15),
        productId,
        quantity,
        price,
        subtotal: quantity * price,
        addedAt: new Date(),
      };
      this.items.push(newItem);
    }

    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this.items = this.items.filter(item => item.productId !== productId);
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  updateItemQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const item = this.items.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = quantity * item.price;
      this.recalculateTotal();
      this.updatedAt = new Date();
    }
  }

  clear(): void {
    this.items = [];
    this.total = 0;
    this.itemCount = 0;
    this.updatedAt = new Date();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Validation
  validate(): string[] {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (this.items.length === 0) {
      errors.push('Cart cannot be empty');
    }

    this.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be positive`);
      }
      if (item.price < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }
    });

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }
}