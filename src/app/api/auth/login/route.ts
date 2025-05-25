import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '@/config/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    // Check credentials
    const isValidUsername = username === AUTH_CONFIG.username;
    const isValidPassword = password === AUTH_CONFIG.password;

    if (!isValidUsername || !isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        username: AUTH_CONFIG.username,
        iat: Math.floor(Date.now() / 1000)
      },
      AUTH_CONFIG.jwtSecret,
      { expiresIn: AUTH_CONFIG.sessionExpiry }
    );

    // Create response with httpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: { username: AUTH_CONFIG.username }
      },
      { status: 200 }
    );

    // Set httpOnly cookie for security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_CONFIG.sessionExpiry,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}