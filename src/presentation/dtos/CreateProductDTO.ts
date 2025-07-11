import { z } from 'zod';

// Base product validation schema
const ProductBaseSchema = {
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must not exceed 255 characters'),
  
  description: z
    .string()
    .min(1, 'Product description is required')
    .max(1000, 'Product description must not exceed 1000 characters'),
  
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(999999.99, 'Price is too high'),
  
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must not exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  
  categoryId: z
    .string()
    .min(1, 'Category ID is required')
    .uuid('Category ID must be a valid UUID'),
};

// Create Product DTO
export const CreateProductDTO = z.object({
  ...ProductBaseSchema,
  
  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),
  
  isActive: z
    .boolean()
    .optional()
    .default(true),
});

// Update Product DTO (all fields optional except validation requirements)
export const UpdateProductDTO = z.object({
  name: ProductBaseSchema.name.optional(),
  description: ProductBaseSchema.description.optional(),
  price: ProductBaseSchema.price.optional(),
  sku: ProductBaseSchema.sku.optional(),
  categoryId: ProductBaseSchema.categoryId.optional(),
  
  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .optional(),
  
  isActive: z.boolean().optional(),
});

// Product Query DTO (for filtering and pagination)
export const ProductQueryDTO = z.object({
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
  
  active: z
    .string()
    .regex(/^(true|false)$/, 'active must be true or false')
    .transform((val) => val === 'true')
    .optional(),
  
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'price', 'stock'])
    .optional()
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Product Search DTO
export const ProductSearchDTO = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must not exceed 100 characters'),
  
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
});

// Price Range DTO
export const PriceRangeDTO = z.object({
  min: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Min price must be a valid decimal number')
    .transform(Number)
    .refine((val) => val >= 0, 'Min price cannot be negative'),
  
  max: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Max price must be a valid decimal number')
    .transform(Number)
    .refine((val) => val >= 0, 'Max price cannot be negative'),
  
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
}).refine((data) => data.min <= data.max, {
  message: 'Min price must be less than or equal to max price',
  path: ['min'],
});

// Update Stock DTO
export const UpdateStockDTO = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
});

// Product ID Parameter DTO
export const ProductIdDTO = z.object({
  id: z
    .string()
    .uuid('Product ID must be a valid UUID'),
});

// Product SKU Parameter DTO
export const ProductSkuDTO = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must not exceed 50 characters'),
});

// Category ID Parameter DTO
export const CategoryIdDTO = z.object({
  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID'),
});

// Low Stock Query DTO
export const LowStockQueryDTO = z.object({
  threshold: z
    .string()
    .regex(/^\d+$/, 'Threshold must be a positive number')
    .transform(Number)
    .refine((val) => val >= 0, 'Threshold cannot be negative')
    .optional()
    .default('10'),
});

// Export types
export type CreateProductDTO = z.infer<typeof CreateProductDTO>;
export type UpdateProductDTO = z.infer<typeof UpdateProductDTO>;
export type ProductQueryDTO = z.infer<typeof ProductQueryDTO>;
export type ProductSearchDTO = z.infer<typeof ProductSearchDTO>;
export type PriceRangeDTO = z.infer<typeof PriceRangeDTO>;
export type UpdateStockDTO = z.infer<typeof UpdateStockDTO>;
export type ProductIdDTO = z.infer<typeof ProductIdDTO>;
export type ProductSkuDTO = z.infer<typeof ProductSkuDTO>;
export type CategoryIdDTO = z.infer<typeof CategoryIdDTO>;
export type LowStockQueryDTO = z.infer<typeof LowStockQueryDTO>;