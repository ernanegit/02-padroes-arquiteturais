import { z } from 'zod';
import { UserRole } from '@/business/domain/User';

// Base user validation schema
const UserBaseSchema = {
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must not exceed 255 characters'),
  
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'First name must contain only letters and spaces'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Last name must contain only letters and spaces'),
};

// Create User DTO
export const CreateUserDTO = z.object({
  ...UserBaseSchema,
  
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  
  role: z
    .nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Invalid user role' }),
    })
    .optional()
    .default(UserRole.CUSTOMER),
  
  isActive: z
    .boolean()
    .optional()
    .default(true),
});

// Update User DTO (all fields optional except validation requirements)
export const UpdateUserDTO = z.object({
  email: UserBaseSchema.email.optional(),
  firstName: UserBaseSchema.firstName.optional(),
  lastName: UserBaseSchema.lastName.optional(),
  
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    )
    .optional(),
  
  role: z
    .nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Invalid user role' }),
    })
    .optional(),
  
  isActive: z.boolean().optional(),
});

// Login DTO
export const LoginDTO = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Change Password DTO
export const ChangePasswordDTO = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User Query DTO (for filtering and pagination)
export const UserQueryDTO = z.object({
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
  
  search: z
    .string()
    .max(100, 'Search term must not exceed 100 characters')
    .optional(),
  
  role: z
    .nativeEnum(UserRole)
    .optional(),
  
  isActive: z
    .string()
    .regex(/^(true|false)$/, 'isActive must be true or false')
    .transform((val) => val === 'true')
    .optional(),
  
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'])
    .optional()
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Export types
export type CreateUserDTO = z.infer<typeof CreateUserDTO>;
export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;
export type LoginDTO = z.infer<typeof LoginDTO>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordDTO>;
export type UserQueryDTO = z.infer<typeof UserQueryDTO>;