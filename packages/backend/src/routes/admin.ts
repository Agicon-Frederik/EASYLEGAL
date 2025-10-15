import express, { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  type CreateUserInput,
  type UpdateUserInput
} from '../validation/userSchemas';
import { z } from 'zod';

const router = express.Router();

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get a single user by ID
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const { id } = userIdSchema.parse({ id: req.params.id });

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: error.issues,
      });
    }

    console.error('Error fetching user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.params.id,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

/**
 * POST /api/admin/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const userData: CreateUserInput = createUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Create the user
    const user = await prisma.user.create({
      data: userData,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      });
    }

    console.error('Error creating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update an existing user
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const { id } = userIdSchema.parse({ id: req.params.id });

    // Validate request body
    const updateData: UpdateUserInput = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If email is being updated, check it's not already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }
    }

    // Update the user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      });
    }

    console.error('Error updating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.params.id,
      requestBody: req.body,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const { id } = userIdSchema.parse({ id: req.params.id });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: error.issues,
      });
    }

    console.error('Error deleting user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.params.id,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

export default router;
