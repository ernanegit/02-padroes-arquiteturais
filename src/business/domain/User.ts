export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  MODERATOR = 'MODERATOR',
}

export class User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<User>) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.role = data.role || UserRole.CUSTOMER;
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Business logic methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isModerator(): boolean {
    return this.role === UserRole.MODERATOR;
  }

  isCustomer(): boolean {
    return this.role === UserRole.CUSTOMER;
  }

  canManageUsers(): boolean {
    return this.isAdmin() || this.isModerator();
  }

  canManageProducts(): boolean {
    return this.isAdmin() || this.isModerator();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateProfile(firstName: string, lastName: string): void {
    this.firstName = firstName;
    this.lastName = lastName;
    this.updatedAt = new Date();
  }

  // Validation methods
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isValidPassword(): boolean {
    // Password should be at least 6 characters
    return this.password.length >= 6;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail()) {
      errors.push('Invalid email format');
    }

    if (!this.password) {
      errors.push('Password is required');
    } else if (!this.isValidPassword()) {
      errors.push('Password must be at least 6 characters');
    }

    if (!this.firstName) {
      errors.push('First name is required');
    }

    if (!this.lastName) {
      errors.push('Last name is required');
    }

    return errors;
  }

  // Convert to safe object (without password)
  toSafeObject(): Omit<User, 'password'> {
    const { password, ...safeUser } = this;
    return safeUser;
  }
}