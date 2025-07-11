import { z } from 'zod';

// Login DTO
export const LoginDTO = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must not exceed 255 characters'),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must not exceed 100 characters'),
});

// Refresh Token DTO
export const RefreshTokenDTO = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

// Verify Token DTO
export const VerifyTokenDTO = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
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

// Forgot Password DTO
export const ForgotPasswordDTO = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
});

// Reset Password DTO
export const ResetPasswordDTO = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Export types
export type LoginDTO = z.infer<typeof LoginDTO>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTO>;
export type VerifyTokenDTO = z.infer<typeof VerifyTokenDTO>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordDTO>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTO>;
export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTO>;