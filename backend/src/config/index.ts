import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'brightloop_production_grade_jwt_secret_kochi_hackathon_2026_odoo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  enableDemoLogin: process.env.ENABLE_DEMO_LOGIN !== undefined ? process.env.ENABLE_DEMO_LOGIN === 'true' : process.env.NODE_ENV !== 'production',
  demoAccounts: {
    adminEmail: (process.env.DEMO_ADMIN_EMAIL || 'demo.admin@brightloop.io').toLowerCase().trim(),
    staffEmail: (process.env.DEMO_STAFF_EMAIL || 'demo.staff@brightloop.io').toLowerCase().trim(),
    customerEmail: (process.env.DEMO_CUSTOMER_EMAIL || 'demo.customer@brightloop.io').toLowerCase().trim(),
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Brightloop Software <billing@brightloop.io>',
  },
};

