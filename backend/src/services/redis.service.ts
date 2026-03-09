// ═══════════════════════════════════════════════════════════════
// REDIS SERVICE - Pub/Sub for Real-Time Events
// ═══════════════════════════════════════════════════════════════

import Redis from 'ioredis';
import logger from '../config/logger';

class RedisService {
  private publisher: Redis;
  private subscriber: Redis;
  private isConnected: boolean = false;

  constructor() {
    // Initialize Redis connections
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    // Subscriber needs special config to avoid "subscriber mode" errors
    const subscriberConfig = {
      ...redisConfig,
      enableReadyCheck: false, // Disable ready check for subscriber
      lazyConnect: false,
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(subscriberConfig);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.publisher.on('connect', () => {
      logger.info('✅ Redis Publisher connected');
      this.isConnected = true;
    });

    this.publisher.on('error', (error) => {
      logger.error('❌ Redis Publisher error:', error);
      this.isConnected = false;
    });

    this.subscriber.on('connect', () => {
      logger.info('✅ Redis Subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error('❌ Redis Subscriber error:', error);
    });
  }

  /**
   * Publish an event to a channel
   */
  async publish(channel: string, data: any): Promise<void> {
    try {
      const message = JSON.stringify(data);
      await this.publisher.publish(channel, message);
      logger.debug(`📡 Published to ${channel}:`, data);
    } catch (error) {
      logger.error(`Failed to publish to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      
      this.subscriber.on('message', (ch, msg) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(msg);
            handler(data);
          } catch (error) {
            logger.error(`Failed to parse message from ${channel}:`, error);
          }
        }
      });

      logger.info(`👂 Subscribed to channel: ${channel}`);
    } catch (error) {
      logger.error(`Failed to subscribe to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      logger.info(`🔇 Unsubscribed from channel: ${channel}`);
    } catch (error) {
      logger.error(`Failed to unsubscribe from ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect Redis clients
   */
  async disconnect(): Promise<void> {
    try {
      await this.publisher.quit();
      await this.subscriber.quit();
      this.isConnected = false;
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
      throw error;
    }
  }

  /**
   * Check if Redis is connected
   */
  getStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get publisher instance (for direct access if needed)
   */
  getPublisher(): Redis {
    return this.publisher;
  }

  /**
   * Get subscriber instance (for direct access if needed)
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }
}

// Export singleton instance
export default new RedisService();

// Channel names for pub/sub
export const CHANNELS = {
  // Price updates
  PRICE_UPDATE: 'price:update',
  MARKET_DATA: 'market:data',
  
  // Portfolio updates
  PORTFOLIO_UPDATE: 'portfolio:update',
  PORTFOLIO_VALUE: 'portfolio:value',
  
  // Position updates
  POSITION_UPDATE: 'position:update',
  POSITION_CHANGE: 'position:change',
  
  // Trade notifications
  TRADE_EXECUTED: 'trade:executed',
  TRADE_FAILED: 'trade:failed',
  
  // Alerts
  ALERT_NEW: 'alert:new',
  ALERT_TRIGGERED: 'alert:triggered',
  RISK_BREACH: 'risk:breach',
  
  // System events
  SYSTEM_STATUS: 'system:status',
  USER_ACTION: 'user:action',
};
