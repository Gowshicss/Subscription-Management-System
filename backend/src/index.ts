import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';
import { startBillingCron } from './cron/billing-cron';

const app = express();

// CORS Configuration
const allowedOrigins = [
  config.frontendUrl,
  config.frontendUrl.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in hackathon/dev while maintaining origin headers
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Lightweight Health Check Endpoint (usable by Render / monitoring)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'brightloop-backend',
    environment: config.env,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'brightloop-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', healthHandler);
app.get('/health/', healthHandler);
app.get('/api/v1/health/', healthHandler);
app.get('/api/v1/health', healthHandler);

// Mount API v1 router
app.use('/api/v1', apiRouter);

// Central error handler
app.use(errorHandler);

// Start server on 0.0.0.0 for container / cloud hosting routing
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Brightloop Subscription Backend API running on 0.0.0.0:${config.port}`);
  console.log(`   Health Check: http://0.0.0.0:${config.port}/health`);
  console.log(`   API Base URL: http://0.0.0.0:${config.port}/api/v1`);
  console.log(`   Environment:  ${config.env}`);
  console.log(`=======================================================`);

  // Start background recurring billing worker
  startBillingCron(60000);
});

// Graceful process termination
const handleShutdown = (signal: string) => {
  console.log(`[Server] Received ${signal}. Gracefully shutting down HTTP server...`);
  server.close(() => {
    console.log('[Server] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;

