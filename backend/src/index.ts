import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';
import { startBillingCron } from './cron/billing-cron';

const app = express();

// Middlewares
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Brightloop Subscription Management System API',
    time: new Date().toISOString(),
  });
});

// Mount API v1 router
app.use('/api/v1', apiRouter);

// Central error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Brightloop Subscription Backend API running on port ${config.port}`);
  console.log(`   Health Check: http://localhost:${config.port}/health`);
  console.log(`   API Base URL: http://localhost:${config.port}/api/v1`);
  console.log(`   Environment:  ${config.env}`);
  console.log(`=======================================================`);

  // Start background recurring billing worker
  startBillingCron(60000);
});

export default app;
