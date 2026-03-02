// ═══════════════════════════════════════════════════════════════
// EXPRESS APPLICATION SETUP
// ═══════════════════════════════════════════════════════════════

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './config/logger';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import mlRoutes from './routes/ml.routes';
import portfolioRoutes from './routes/portfolio.routes';
import positionRoutes from './routes/position.routes';
import tradeRoutes from './routes/trade.routes';
import userRoutes from './routes/user.routes';
import alertRoutes from './routes/alert.routes';
import analyticsRoutes from './routes/analytics.routes';

const app: Application = express();

// ═══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now, configure in production
  crossOriginEmbedderPolicy: false,
}));

// ═══════════════════════════════════════════════════════════════
// CORS - Cross-Origin Resource Sharing (BEFORE ROUTES!)
// ═══════════════════════════════════════════════════════════════

const corsOptions = {
  origin: config.cors.origin, // Allow specific origins (no wildcard in production)
  credentials: true,           // Allow cookies and authorization headers
  maxAge: 86400,              // Preflight cache: 24 hours
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
};

app.use(cors(corsOptions));

// Handle preflight (OPTIONS) requests explicitly
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ═══════════════════════════════════════════════════════════════
// GENERAL MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// ═══════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════

// API Root - Available endpoints
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'HedgeAI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      authentication: '/api/auth',
      portfolios: '/api/portfolios',
      positions: '/api/positions',
      trades: '/api/trades',
      alerts: '/api/alerts',
      analytics: '/api/analytics',
      users: '/api/users (admin)',
      ml: '/api/ml',
    },
    documentation: 'See API_ROUTES.md for complete endpoint documentation',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  if (config.env === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
