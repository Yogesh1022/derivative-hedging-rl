// ═══════════════════════════════════════════════════════════════
// RISK ALERT ROUTES
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { param, query } from 'express-validator';
import { alertController } from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts for current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate([
    query('isRead').optional().isBoolean(),
    query('severity').optional().isIn(['INFO', 'WARNING', 'CRITICAL']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  alertController.getAllAlerts
);

/**
 * @route   GET /api/alerts/:id
 * @desc    Get alert by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid alert ID required')]),
  alertController.getAlertById
);

/**
 * @route   PUT /api/alerts/:id/read
 * @desc    Mark alert as read
 * @access  Private
 */
router.put(
  '/:id/read',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid alert ID required')]),
  alertController.markAsRead
);

/**
 * @route   PUT /api/alerts/:id/dismiss
 * @desc    Dismiss alert
 * @access  Private
 */
router.put(
  '/:id/dismiss',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid alert ID required')]),
  alertController.dismissAlert
);

/**
 * @route   PUT /api/alerts/read-all
 * @desc    Mark all alerts as read
 * @access  Private
 */
router.put('/read-all', authenticate, alertController.markAllAsRead);

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete alert
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid alert ID required')]),
  alertController.deleteAlert
);

export default router;
