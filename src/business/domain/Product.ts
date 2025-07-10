export class Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Product>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.sku = data.sku || '';
    this.stock = data.stock || 0;
    this.categoryId = data.categoryId || '';
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Business logic methods
  isInStock(): boolean {
    return this.stock > 0;
  }

  canFulfillQuantity(quantity: number): boolean {
    return this.stock >= quantity;
  }

  reduceStock(quantity: number): void {
    if (!this.canFulfillQuantity(quantity)) {
      throw new Error(`Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`);
    }
    this.stock -= quantity;
    this.updatedAt = new Date();
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.stock += quantity;
    this.updatedAt = new Date();
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateDetails(name: string, description: string): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
  }

  // Calculated properties
  getFormattedPrice(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.price);
  }

  getStockStatus(): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (this.stock === 0) return 'out_of_stock';
    if (this.stock <= 10) return 'low_stock';
    return 'in_stock';
  }

  // Validation methods
  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Product description is required');
    }

    if (this.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (!this.sku || this.sku.trim().length === 0) {
      errors.push('SKU is required');
    }

    if (this.stock < 0) {
      errors.push('Stock cannot be negative');
    }

    if (!this.categoryId || this.categoryId.trim().length === 0) {
      errors.push('Category is required');
    }

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  // Search helper
  matchesQuery(query: string): boolean {
    const searchTerms = query.toLowerCase().split(' ');
    const searchableText = `${this.name} ${this.description} ${this.sku}`.toLowerCase();
    
    return searchTerms.every(term => searchableText.includes(term));
  }
}