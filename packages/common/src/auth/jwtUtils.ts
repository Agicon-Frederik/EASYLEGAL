import jwt from 'jsonwebtoken';

export interface TokenPayload {
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  private secret: string;

  constructor(secret: string) {
    if (!secret) {
      throw new Error('JWT secret is required');
    }
    this.secret = secret;
  }

  /**
   * Generate a magic link token (valid for 15 minutes)
   */
  generateMagicLinkToken(email: string, name: string): string {
    return jwt.sign(
      { email, name },
      this.secret,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate a session token (valid for 7 days)
   */
  generateSessionToken(email: string, name: string): string {
    return jwt.sign(
      { email, name },
      this.secret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
