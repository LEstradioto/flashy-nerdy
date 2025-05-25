import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '@/config/auth';

export interface AuthUser {
  username: string;
}

interface JWTPayload {
  username: string;
  iat: number;
}

export function verifyAuth(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret) as JWTPayload;

    return {
      username: decoded.username
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = verifyAuth(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}