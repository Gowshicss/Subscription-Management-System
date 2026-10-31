import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { Role } from '@prisma/client';
import { emailService } from './email.service';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  billingAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateStaffInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Problem statement password validation:
// "more than eight characters, with an uppercase letter, a lowercase letter and a special character"
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length <= 8) {
    return { valid: false, reason: 'Password must be more than 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

class AuthService {
  async registerCustomer(input: RegisterInput) {
    const passwordCheck = validatePasswordStrength(input.password);
    if (!passwordCheck.valid) {
      const err: any = new Error(passwordCheck.reason);
      err.statusCode = 400;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check for existing User account with this email
      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        const err: any = new Error('An account with this email address already exists.');
        err.statusCode = 409;
        err.code = 'EMAIL_EXISTS';
        throw err;
      }

      // 2. Check for existing CRM Customer profile with this email
      const existingCustomer = await tx.customer.findUnique({
        where: { email: normalizedEmail },
      });

      // 3. If Customer profile exists and is already linked to a User account, reject
      if (existingCustomer && existingCustomer.userId) {
        const err: any = new Error('A customer profile associated with this email address is already linked to an account.');
        err.statusCode = 409;
        err.code = 'CUSTOMER_ALREADY_LINKED';
        throw err;
      }

      // 4. Create the new User account with strictly Role.CUSTOMER
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: Role.CUSTOMER,
          phone: input.phone.trim(),
        },
      });

      let customer;
      if (existingCustomer) {
        // 5. Link existing unlinked CRM Customer to the newly created User account
        customer = await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            userId: user.id,
            contactName: `${input.firstName.trim()} ${input.lastName.trim()}`,
            phone: input.phone.trim() || existingCustomer.phone,
            billingAddress: input.billingAddress.trim() || existingCustomer.billingAddress,
            city: input.city?.trim() || existingCustomer.city,
            state: input.state?.trim() || existingCustomer.state,
            country: input.country?.trim() || existingCustomer.country,
            postalCode: input.postalCode?.trim() || existingCustomer.postalCode,
            taxNumber: input.taxNumber?.trim() || existingCustomer.taxNumber,
          },
        });
      } else {
        // 6. If no Customer profile exists, create new Customer record
        customer = await tx.customer.create({
          data: {
            userId: user.id,
            companyName: input.companyName.trim(),
            contactName: `${input.firstName.trim()} ${input.lastName.trim()}`,
            email: user.email,
            phone: input.phone.trim(),
            billingAddress: input.billingAddress.trim(),
            city: input.city?.trim() || null,
            state: input.state?.trim() || null,
            country: input.country?.trim() || 'USA',
            postalCode: input.postalCode?.trim() || null,
            taxNumber: input.taxNumber?.trim() || null,
          },
        });
      }

      return { user, customer };
    });

    const token = jwt.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        customerId: result.customer.id,
        companyName: result.customer.companyName,
      },
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: { customer: true },
    });

    if (!user) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.isActive) {
      const err: any = new Error('Your account has been deactivated. Please contact administration.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerId: user.customer?.id || null,
        companyName: user.customer?.companyName || null,
      },
    };
  }

  async createStaff(input: CreateStaffInput) {
    const passwordCheck = validatePasswordStrength(input.password);
    if (!passwordCheck.valid) {
      const err: any = new Error(passwordCheck.reason);
      err.statusCode = 400;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });
    if (existingUser) {
      const err: any = new Error('A user with this email already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: Role.STAFF,
        phone: input.phone?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Do not leak user existence for public endpoint, but proceed if exists
    if (!user) {
      return { message: 'If this email is registered, a password reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);

    return {
      message: 'If this email is registered, a password reset link has been dispatched.',
      // For local development convenience:
      debugToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      const err: any = new Error(passwordCheck.reason);
      err.statusCode = 400;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      const err: any = new Error('Invalid or expired password reset token.');
      err.statusCode = 400;
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    if (resetRecord.usedAt !== null) {
      const err: any = new Error('This password reset link has already been used.');
      err.statusCode = 400;
      err.code = 'TOKEN_ALREADY_USED';
      throw err;
    }

    if (new Date() > resetRecord.expiresAt) {
      const err: any = new Error('This password reset link has expired. Please request a new one.');
      err.statusCode = 400;
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been successfully updated. You may now log in.' };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    const isDemo = Boolean(
      user.email === config.demoAccounts.adminEmail ||
      user.email === config.demoAccounts.staffEmail ||
      user.email === config.demoAccounts.customerEmail
    );
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      customer: user.customer,
      isDemo,
    };
  }

  async demoLogin(role: Role) {
    if (!config.enableDemoLogin) {
      const err: any = new Error('Demo quick-login is disabled on this server.');
      err.statusCode = 403;
      err.code = 'DEMO_DISABLED';
      throw err;
    }

    let targetEmail: string;
    if (role === Role.ADMIN) {
      targetEmail = config.demoAccounts.adminEmail;
    } else if (role === Role.STAFF) {
      targetEmail = config.demoAccounts.staffEmail;
    } else if (role === Role.CUSTOMER) {
      targetEmail = config.demoAccounts.customerEmail;
    } else {
      const err: any = new Error('Invalid demo role requested. Allowed: ADMIN, STAFF, CUSTOMER.');
      err.statusCode = 400;
      err.code = 'INVALID_ROLE';
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { customer: true },
    });

    if (!user) {
      const err: any = new Error(
        `Demo ${role.toLowerCase()} account (${targetEmail}) has not been provisioned yet. Please run the demo setup script.`
      );
      err.statusCode = 404;
      err.code = 'DEMO_ACCOUNT_NOT_FOUND';
      throw err;
    }

    if (!user.isActive) {
      const err: any = new Error('This demo evaluator account has been disabled.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    if (user.role !== role) {
      const err: any = new Error(`Role mismatch: expected ${role}, but found ${user.role}.`);
      err.statusCode = 403;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, isDemo: true },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerId: user.customer?.id || null,
        companyName: user.customer?.companyName || null,
        isDemo: true,
      },
    };
  }
}

export const authService = new AuthService();
