import express, { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { JWTUtils, emailService, type AuthResponse } from '@easylegal/common';

const router = express.Router();

// Initialize JWT utils
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const jwtUtils = new JWTUtils(JWT_SECRET);

// Get frontend URL from environment or use default
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * POST /api/auth/request-magic-link
 * Request a magic link to be sent to the user's email
 */
router.post('/request-magic-link', async (req: Request, res: Response) => {
  try {
    const { email, language = 'en' } = req.body;

    if (!email) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.emailRequired'),
      };
      return res.status(400).json(response);
    }

    // Check if user is authorized (using Prisma)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.unauthorized'),
      };
      return res.status(403).json(response);
    }

    // Generate magic link token
    const token = jwtUtils.generateMagicLinkToken(user.email, user.name);
    const magicLink = `${FRONTEND_URL}/auth/verify?token=${token}`;

    // Send magic link email
    const emailSent = await emailService.sendMagicLink(
      user.email,
      user.name,
      magicLink,
      language
    );

    if (!emailSent) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.emailFailed'),
      };
      return res.status(500).json(response);
    }

    const response: AuthResponse = {
      success: true,
      message: req.t('auth.success.magicLinkSent'),
    };
    return res.json(response);
  } catch (error) {
    // Log detailed error information for debugging
    const requestEmail = req.body.email;
    console.error('Error requesting magic link:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email: requestEmail ? requestEmail.toLowerCase() : 'not provided',
      timestamp: new Date().toISOString(),
    });

    // Provide more specific error messages
    let errorMessage = req.t('auth.errors.serverError');
    let statusCode = 500;

    if (error instanceof Error) {
      // Database errors
      if (error.message.includes('Database not initialized')) {
        errorMessage = req.t('auth.errors.databaseError');
        console.error('CRITICAL: Database not initialized when attempting to request magic link');
      }
      // Email service errors
      else if (error.message.includes('Email service not initialized')) {
        errorMessage = req.t('auth.errors.emailServiceNotConfigured');
        console.error('CRITICAL: Email service not initialized. Check SMTP configuration.');
      }
      // JWT errors
      else if (error.message.includes('jwt') || error.message.includes('token')) {
        errorMessage = req.t('auth.errors.tokenGenerationFailed');
        console.error('CRITICAL: Failed to generate JWT token');
      }
    }

    const response: AuthResponse = {
      success: false,
      message: errorMessage,
    };
    return res.status(statusCode).json(response);
  }
});

/**
 * POST /api/auth/verify-token
 * Verify the magic link token and return a session token
 */
router.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.tokenRequired'),
      };
      return res.status(400).json(response);
    }

    // Verify the magic link token
    const payload = jwtUtils.verifyToken(token);

    if (!payload) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.tokenInvalid'),
      };
      return res.status(401).json(response);
    }

    // Double-check user is still authorized (using Prisma)
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.unauthorized'),
      };
      return res.status(403).json(response);
    }

    // Generate a session token (valid for 7 days)
    const sessionToken = jwtUtils.generateSessionToken(payload.email, payload.name);

    const response: AuthResponse = {
      success: true,
      message: req.t('auth.success.loginSuccess'),
      token: sessionToken,
      user: {
        email: payload.email,
        name: payload.name,
      },
    };
    return res.json(response);
  } catch (error) {
    // Log detailed error information for debugging
    const requestToken = req.body.token;
    console.error('Error verifying token:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasToken: !!requestToken,
      timestamp: new Date().toISOString(),
    });

    // Provide more specific error messages
    let errorMessage = req.t('auth.errors.serverError');
    let statusCode = 500;

    if (error instanceof Error) {
      // JWT verification errors
      if (error.message.includes('jwt expired')) {
        errorMessage = req.t('auth.errors.tokenExpired');
        statusCode = 401;
      } else if (error.message.includes('jwt malformed') || error.message.includes('invalid signature')) {
        errorMessage = req.t('auth.errors.tokenInvalid');
        statusCode = 401;
      }
      // Database errors
      else if (error.message.includes('Database not initialized')) {
        errorMessage = req.t('auth.errors.databaseError');
        console.error('CRITICAL: Database not initialized when attempting to verify token');
      }
    }

    const response: AuthResponse = {
      success: false,
      message: errorMessage,
    };
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /api/auth/verify-session
 * Verify if a session token is still valid
 */
router.get('/verify-session', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.tokenRequired'),
      };
      return res.status(401).json(response);
    }

    const token = authHeader.substring(7);
    const payload = jwtUtils.verifyToken(token);

    if (!payload) {
      const response: AuthResponse = {
        success: false,
        message: req.t('auth.errors.tokenInvalid'),
      };
      return res.status(401).json(response);
    }

    const response: AuthResponse = {
      success: true,
      message: req.t('auth.success.sessionValid'),
      user: {
        email: payload.email,
        name: payload.name,
      },
    };
    return res.json(response);
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error verifying session:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasAuthHeader: !!req.headers.authorization,
      timestamp: new Date().toISOString(),
    });

    // Provide more specific error messages
    let errorMessage = req.t('auth.errors.serverError');
    let statusCode = 500;

    if (error instanceof Error) {
      // JWT verification errors
      if (error.message.includes('jwt expired')) {
        errorMessage = req.t('auth.errors.tokenExpired');
        statusCode = 401;
      } else if (error.message.includes('jwt malformed') || error.message.includes('invalid signature')) {
        errorMessage = req.t('auth.errors.tokenInvalid');
        statusCode = 401;
      }
    }

    const response: AuthResponse = {
      success: false,
      message: errorMessage,
    };
    return res.status(statusCode).json(response);
  }
});

export default router;
