import { z } from 'zod';

/**
 * Zod validation schemas for User operations
 * These schemas ensure data integrity and type safety across the application
 */

// Base user schema with all fields
export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  createdAt: z.date(),
});

// Schema for creating a new user (no id or createdAt)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').trim(),
});

// Schema for updating a user (all fields optional except id)
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').trim().optional(),
}).refine(data => data.email !== undefined || data.name !== undefined, {
  message: 'At least one field (email or name) must be provided for update',
});

// Schema for user ID parameter
export const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

// Type exports for use in the application
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdSchema>;
