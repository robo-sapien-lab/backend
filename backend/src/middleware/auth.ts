import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError, SupabaseJWTPayload } from '../types';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No authorization header or invalid format', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.SUPABASE_JWT_SECRET) {
      throw new CustomError('JWT secret not configured', 500, 'CONFIGURATION_ERROR');
    }

    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET) as SupabaseJWTPayload;
      
      // Validate token expiration
      if (decoded.exp < Date.now() / 1000) {
        throw new CustomError('Token expired', 401, 'TOKEN_EXPIRED');
      }

      // Extract user information from JWT
      req.user = {
        id: decoded.sub,
        ...(decoded.email ? { email: decoded.email } : {}),
        ...(decoded.role ? { role: decoded.role } : {})
      };

      next();
    } catch (jwtError) {
      throw new CustomError('Invalid JWT token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }
};

export const validateOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  // Extract studentId from request (either from body, params, or query)
  const studentId = req.body.studentId || req.params.studentId || req.query.studentId;
  
  if (!studentId) {
    res.status(400).json({
      error: 'Student ID is required',
      code: 'MISSING_STUDENT_ID'
    });
    return;
  }

  // Ensure the authenticated user can only access their own data
  if (req.user.id !== studentId) {
    res.status(403).json({
      error: 'Access denied: You can only access your own data',
      code: 'ACCESS_DENIED'
    });
    return;
  }

  next();
};
