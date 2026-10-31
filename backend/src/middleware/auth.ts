import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  customerId?: string | null;
  isDemo?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' },
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; isDemo?: boolean };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { customer: { select: { id: true } } },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_INACTIVE', message: 'User account is not found or has been disabled.' },
      });
      return;
    }

    const isDemo = Boolean(
      decoded.isDemo ||
      user.email === config.demoAccounts.adminEmail ||
      user.email === config.demoAccounts.staffEmail ||
      user.email === config.demoAccounts.customerEmail
    );

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      customerId: user.customer?.id || null,
      isDemo,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired authentication token.' },
    });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}].`,
        },
      });
      return;
    }

    next();
  };
}

export function restrictDemo(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.isDemo) {
    res.status(403).json({
      success: false,
      error: {
        code: 'DEMO_RESTRICTED',
        message: 'This operation is restricted in demo evaluator mode to preserve system data integrity.',
      },
    });
    return;
  }
  next();
}

