import { Request, Response, NextFunction } from 'express';

/**
 * CORS middleware to handle Cross-Origin Resource Sharing
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow requests from frontend (adjust the origin as needed)
  const allowedOrigins = [
    'http://localhost:4200',  // Angular default dev server
    'http://localhost:3000',  // Common React dev server
    'http://127.0.0.1:4200',
    'http://127.0.0.1:3000'
  ];

  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Allow these headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
  );

  // Allow these HTTP methods
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Cache preflight response for 1 hour
  res.setHeader('Access-Control-Max-Age', '3600');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};