// ═══════════════════════════════════════════════════════════════
// SSE (Server-Sent Events) SERVICE
// One-way server-to-client real-time updates
// ═══════════════════════════════════════════════════════════════

import { Response } from 'express';
import logger from '../config/logger';
import redisService, { CHANNELS } from './redis.service';

interface SSEClient {
  id: string;
  userId: string;
  response: Response;
  channels: Set<string>;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Initialize SSE connection for a client
   */
  initializeClient(clientId: string, userId: string, res: Response): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Store client
    const client: SSEClient = {
      id: clientId,
      userId,
      response: res,
      channels: new Set(),
    };
    this.clients.set(clientId, client);

    logger.info(`📺 SSE client connected: ${userId} (${clientId})`);

    // Send initial connection event
    this.sendToClient(clientId, 'connected', {
      message: 'SSE connection established',
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Handle client disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Subscribe client to a channel
   */
  subscribeClient(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn(`Client ${clientId} not found for subscription`);
      return;
    }

    client.channels.add(channel);
    logger.debug(`📡 Client ${clientId} subscribed to ${channel}`);
  }

  /**
   * Unsubscribe client from a channel
   */
  unsubscribeClient(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.delete(channel);
    logger.debug(`🔇 Client ${clientId} unsubscribed from ${channel}`);
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, event: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.response.write(`event: ${event}\n`);
      client.response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      logger.error(`Failed to send SSE to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  /**
   * Send event to all clients of a user
   */
  sendToUser(userId: string, event: string, data: any): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        this.sendToClient(clientId, event, data);
      }
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: string, data: any): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, event, data);
    }
  }

  /**
   * Send event to clients subscribed to a channel
   */
  sendToChannel(channel: string, event: string, data: any): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.channels.has(channel)) {
        this.sendToClient(clientId, event, data);
      }
    }
  }

  /**
   * Remove client
   */
  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        // Ignore errors on close
      }
      this.clients.delete(clientId);
      logger.info(`📺 SSE client disconnected: ${client.userId} (${clientId})`);
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const timestamp = Date.now();
      for (const clientId of this.clients.keys()) {
        this.sendToClient(clientId, 'heartbeat', { timestamp });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connected client count
   */
  getConnectedCount(): number {
    return this.clients.size;
  }

  /**
   * Cleanup all clients
   */
  cleanup(): void {
    this.stopHeartbeat();
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId);
    }
  }
}

// Export singleton instance
export default new SSEService();

// Helper function to generate unique client ID
export function generateClientId(userId: string): string {
  return `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
