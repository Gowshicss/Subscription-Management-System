import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { config } from '../config';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerCustomer(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        success: true,
        data: result,
        message: 'Account successfully registered.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        success: true,
        data: result,
        message: 'Login successful.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Not authenticated.' } });
        return;
      }
      const user = await authService.getMe(req.user.id);
      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: { message: 'Email is required.' } });
        return;
      }
      const result = await authService.requestPasswordReset(email);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        res.status(400).json({ success: false, error: { message: 'Token and newPassword are required.' } });
        return;
      }
      const result = await authService.resetPassword(token, newPassword);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await authService.createStaff(req.body);
      res.status(201).json({
        success: true,
        data: staff,
        message: 'Staff account successfully created.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async listStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staffList = await prisma.user.findMany({
        where: { role: Role.STAFF },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({
        success: true,
        data: staffList,
      });
    } catch (err) {
      next(err);
    }
  }

  static async demoStatus(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        enabled: config.enableDemoLogin,
        roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
      },
    });
  }

  static async demoLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const result = await authService.demoLogin(role);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        success: true,
        data: result,
        message: `Quick-login successful as ${role}.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

