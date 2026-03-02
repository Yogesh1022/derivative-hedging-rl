// ═══════════════════════════════════════════════════════════════
// SERVER ENTRY POINT
// ═══════════════════════════════════════════════════════════════

import app from './app';
import config from './config';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀  HedgeAI Backend Server                                 ║
║                                                               ║
║   Environment:  ${config.env.padEnd(44)}║
║   Port:         ${config.port.toString().padEnd(44)}║
║   Database:     Connected                                     ║
║   ML Service:   ${config.mlService.url.padEnd(44)}║
║                                                               ║
║   Server ready at: http://localhost:${config.port}                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
