// ═══════════════════════════════════════════════════════════════
// SERVER ENTRY POINT
// ═══════════════════════════════════════════════════════════════

import { createServer } from 'http';
import app from './app';
import config from './config';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import websocketService from './services/websocket.service';
import redisService from './services/redis.service';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Create HTTP server (needed for Socket.IO)
    const httpServer = createServer(app);

    // Initialize WebSocket server
    websocketService.initialize(httpServer);

    // Start HTTP server
    const server = httpServer.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀  HedgeAI Backend Server                                 ║
║                                                               ║
║   Environment:  ${config.env.padEnd(44)}║
║   Port:         ${config.port.toString().padEnd(44)}║
║   Database:     Connected                                     ║
║   ML Service:   ${config.mlService.url.padEnd(44)}║
║   WebSocket:    Enabled                                       ║
║   Redis:        ${redisService.getStatus() ? 'Connected' : 'Disconnected'}                                     ║
║                                                               ║
║   Server ready at: http://localhost:${config.port}                   ║
║   WebSocket:       ws://localhost:${config.port}                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Disconnect Redis
        try {
          await redisService.disconnect();
          logger.info('Redis disconnected');
        } catch (error) {
          logger.error('Error disconnecting Redis:', error);
        }
        
        // Disconnect database
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
