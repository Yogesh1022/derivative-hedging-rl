// ═══════════════════════════════════════════════════════════════
// SSE ROUTES - Server-Sent Events Endpoints
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import sseService, { generateClientId } from '../services/sse.service';
import logger from '../config/logger';

const router = Router();

/**
 * @route   GET /api/sse/stream
 * @desc    Establish SSE connection
 * @access  Private
 */
router.get('/stream', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const clientId = generateClientId(userId);

  // Initialize SSE connection
  sseService.initializeClient(clientId, userId, res);

  // Subscribe to user-specific channels
  sseService.subscribeClient(clientId, `user:${userId}`);

  logger.info(`SSE stream established for user: ${userId}`);
});

/**
 * @route   POST /api/sse/subscribe
 * @desc    Subscribe to additional channels
 * @access  Private
 */
router.post('/subscribe', authenticate, (req: Request, res: Response) => {
  try {
    const { clientId, channels } = req.body;

    if (!clientId || !channels || !Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        error: 'clientId and channels array are required',
      });
    }

    channels.forEach(channel => {
      sseService.subscribeClient(clientId, channel);
    });

    res.json({
      success: true,
      message: `Subscribed to ${channels.length} channels`,
    });
  } catch (error: any) {
    logger.error('SSE subscribe error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/sse/status
 * @desc    Get SSE service status
 * @access  Private
 */
router.get('/status', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      connected: sseService.getConnectedCount(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
