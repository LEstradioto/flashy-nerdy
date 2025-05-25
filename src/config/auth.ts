// Authentication configuration
// You can change these credentials by setting environment variables in .env.local

export const AUTH_CONFIG = {
  // Username for login (set AUTH_USERNAME in .env.local to change)
  username: process.env.AUTH_USERNAME || 'admin',

  // Password for login (set AUTH_PASSWORD in .env.local to change)
  password: process.env.AUTH_PASSWORD || 'flashcards123',

  // JWT secret (IMPORTANT: set JWT_SECRET in .env.local for security)
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',

  // Session expiry in seconds (default 24 hours)
  sessionExpiry: parseInt(process.env.SESSION_EXPIRY || '86400'),
};

// Validation
if (typeof window === 'undefined') {
  // Server-side only warnings
  if (AUTH_CONFIG.jwtSecret === 'default-jwt-secret-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in .env.local for security!');
  }

  if (AUTH_CONFIG.username === 'admin' && AUTH_CONFIG.password === 'flashcards123') {
    console.warn('⚠️  WARNING: Using default credentials. Set AUTH_USERNAME and AUTH_PASSWORD in .env.local!');
  }
}