// ═══════════════════════════════════════════════════════════════
// WEBSOCKET SERVICE - Real-Time Bidirectional Communication
// ═══════════════════════════════════════════════════════════════

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../config/logger';
import redisService, { CHANNELS } from './redis.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Handle connections
    this.io.on('connection', this.handleConnection.bind(this));

    // Subscribe to Redis channels
    this.subscribeToRedisChannels();

    logger.info('🔌 WebSocket server initialized');
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;

      logger.debug(`🔐 Socket authenticated: ${socket.userEmail}`);
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Invalid token'));
    }
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    logger.info(`✅ Client connected: ${socket.userEmail} (${socket.id})`);

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);
    socket.join(`role:${socket.userRole}`);

    // Send connection success
    socket.emit('connected', {
      message: 'Connected to HedgeAI real-time service',
      userId,
      timestamp: new Date().toISOString(),
    });

    // Handle subscriptions
    socket.on('subscribe:portfolio', (portfolioId: string) => {
      socket.join(`portfolio:${portfolioId}`);
      logger.debug(`📊 ${socket.userEmail} subscribed to portfolio:${portfolioId}`);
    });

    socket.on('subscribe:position', (positionId: string) => {
      socket.join(`position:${positionId}`);
      logger.debug(`📈 ${socket.userEmail} subscribed to position:${positionId}`);
    });

    socket.on('subscribe:prices', (symbols: string[]) => {
      symbols.forEach(symbol => socket.join(`price:${symbol}`));
      logger.debug(`💱 ${socket.userEmail} subscribed to prices: ${symbols.join(', ')}`);
    });

    socket.on('unsubscribe:portfolio', (portfolioId: string) => {
      socket.leave(`portfolio:${portfolioId}`);
    });

    socket.on('unsubscribe:position', (positionId: string) => {
      socket.leave(`position:${positionId}`);
    });

    socket.on('unsubscribe:prices', (symbols: string[]) => {
      symbols.forEach(symbol => socket.leave(`price:${symbol}`));
    });

    // Handle custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`❌ Client disconnected: ${socket.userEmail} (${socket.id})`);
      
      // Remove from tracking
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.userEmail}:`, error);
    });
  }

  /**
   * Subscribe to Redis channels and forward to WebSocket clients
   */
  private subscribeToRedisChannels(): void {
    // Price updates
    redisService.subscribe(CHANNELS.PRICE_UPDATE, (data) => {
      this.io?.to(`price:${data.symbol}`).emit('price:update', data);
    });

    // Portfolio updates
    redisService.subscribe(CHANNELS.PORTFOLIO_UPDATE, (data) => {
      this.io?.to(`portfolio:${data.portfolioId}`).emit('portfolio:update', data);
    });

    redisService.subscribe(CHANNELS.PORTFOLIO_VALUE, (data) => {
      this.io?.to(`portfolio:${data.portfolioId}`).emit('portfolio:value', data);
    });

    // Position updates
    redisService.subscribe(CHANNELS.POSITION_UPDATE, (data) => {
      this.io?.to(`position:${data.positionId}`).emit('position:update', data);
    });

    // Trade notifications
    redisService.subscribe(CHANNELS.TRADE_EXECUTED, (data) => {
      this.io?.to(`user:${data.userId}`).emit('trade:executed', data);
    });

    redisService.subscribe(CHANNELS.TRADE_FAILED, (data) => {
      this.io?.to(`user:${data.userId}`).emit('trade:failed', data);
    });

    // Alerts
    redisService.subscribe(CHANNELS.ALERT_NEW, (data) => {
      this.io?.to(`user:${data.userId}`).emit('alert:new', data);
    });

    redisService.subscribe(CHANNELS.ALERT_TRIGGERED, (data) => {
      this.io?.to(`user:${data.userId}`).emit('alert:triggered', data);
    });

    redisService.subscribe(CHANNELS.RISK_BREACH, (data) => {
      // Broadcast to all risk managers
      this.io?.to('role:RISK_MANAGER').emit('risk:breach', data);
      // Also send to specific user
      if (data.userId) {
        this.io?.to(`user:${data.userId}`).emit('risk:breach', data);
      }
    });

    logger.info('📡 Subscribed to all Redis channels');
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to specific role
   */
  emitToRole(role: string, event: string, data: any): void {
    this.io?.to(`role:${role}`).emit(event, data);
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: string, data: any): void {
    this.io?.emit(event, data);
  }

  /**
   * Get number of connected clients
   */
  getConnectedCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export default new WebSocketService();
