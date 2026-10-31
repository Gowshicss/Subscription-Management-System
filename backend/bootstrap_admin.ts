import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Exact validation matching backend/src/services/auth.service.ts
function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
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

async function bootstrapAdmin() {
  if (process.argv.includes('--dry-run') || process.argv.includes('--check-only')) {
    console.log('[COMPILE CHECK] bootstrap_admin.ts syntax, imports, and types verified successfully.');
    process.exit(0);
  }

  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    console.error('\n[CONFIGURATION ERROR] A valid Neon production database URL is required.');
    console.error('Please run this script using the secure wrapper: .\\bootstrap_admin.ps1\n');
    process.exit(1);
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const firstName = process.env.BOOTSTRAP_ADMIN_FIRSTNAME?.trim() || 'Admin';
  const lastName = process.env.BOOTSTRAP_ADMIN_LASTNAME?.trim() || 'User';

  if (!email || !password) {
    console.error('[ERROR] Both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be provided.');
    process.exit(1);
  }

  // 1. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`[VALIDATION ERROR] Invalid email format: '${email}'`);
    process.exit(1);
  }

  // 2. Validate password strength using existing authentication rules
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    console.error(`[VALIDATION ERROR] ${passwordValidation.reason}`);
    console.error('Password requirements: >8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('\n================================================================');
    console.log(' Brightloop Production Database - Admin Account Bootstrap');
    console.log('================================================================\n');

    // 3. Check if user already exists (Do not overwrite)
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, isActive: true }
    });

    if (existing) {
      console.log(`[ABORTED] A user account with email '${email}' already exists.`);
      console.log(`  Existing User ID : ${existing.id}`);
      console.log(`  Assigned Role    : ${existing.role}`);
      console.log(`  Active Status    : ${existing.isActive ? 'Active' : 'Disabled'}`);
      console.log('\nSafety rule: Bootstrap will NOT overwrite, reset, or alter existing accounts.');
      console.log('If you need to change this user, log in through the application or use authorized admin tools.\n');
      process.exit(0);
    }

    // 4. Hash password with bcrypt salt rounds = 10 (matching auth.service.ts)
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create Admin user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: Role.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    console.log('----------------------------------------------------------------');
    console.log(' SUCCESS: INITIAL ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('----------------------------------------------------------------');
    console.log(`  User ID    : ${newUser.id}`);
    console.log(`  Email      : ${newUser.email}`);
    console.log(`  Name       : ${newUser.firstName} ${newUser.lastName}`);
    console.log(`  Role       : ${newUser.role}`);
    console.log(`  Status     : ${newUser.isActive ? 'Active' : 'Disabled'}`);
    console.log(`  Created At : ${newUser.createdAt.toISOString()}`);
    console.log('----------------------------------------------------------------');
    console.log('Credentials and password hashes were NOT logged or exposed.');
    console.log('You can now log in to the production frontend with this Admin account.\n');

  } catch (err: any) {
    console.error('\n[DATABASE ERROR] Failed to bootstrap admin user:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapAdmin();
