// ═══════════════════════════════════════════════════════════════
// CONFIGURATION MODULE
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  clientUrl: string;
  databaseUrl: string;
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  mlService: {
    url: string;
    timeout: number;
  };
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
  cors: {
    origin: string | string[];
  };
  redis: {
    url: string;
    enabled: boolean;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '30000', 10),
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },

  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:5173', 'http://localhost:5174'],
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },
};

// Validation
if (!config.jwt.secret || config.jwt.secret === 'change-this-secret') {
  if (config.env === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('⚠️  WARNING: Using default JWT secret. Change this in production!');
}

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL must be set');
}

export default config;
