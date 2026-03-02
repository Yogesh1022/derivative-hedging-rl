// ═══════════════════════════════════════════════════════════════
// TRADE ROUTES
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { tradeController } from '../controllers/trade.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/trades
 * @desc    Get all trades for current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate([
    query('portfolioId').optional().isUUID(),
    query('symbol').optional().trim(),
    query('status').optional().isIn(['PENDING', 'EXECUTED', 'CANCELLED', 'FAILED']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  tradeController.getAllTrades
);

/**
 * @route   GET /api/trades/:id
 * @desc    Get trade by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid trade ID required')]),
  tradeController.getTradeById
);

/**
 * @route   POST /api/trades
 * @desc    Create new trade
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate([
    body('portfolioId').isUUID().withMessage('Valid portfolio ID required'),
    body('symbol').trim().notEmpty().withMessage('Symbol is required'),
    body('side').isIn(['BUY', 'SELL']).withMessage('Side must be BUY or SELL'),
    body('quantity').isDecimal().withMessage('Quantity must be a decimal number'),
    body('price').isDecimal().withMessage('Price must be a decimal number'),
    body('commission').optional().isDecimal(),
  ]),
  tradeController.createTrade
);

/**
 * @route   PUT /api/trades/:id
 * @desc    Update trade status
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid trade ID required'),
    body('status')
      .isIn(['PENDING', 'EXECUTED', 'CANCELLED', 'FAILED'])
      .withMessage('Valid status required'),
    body('executedAt').optional().isISO8601(),
  ]),
  tradeController.updateTrade
);

/**
 * @route   DELETE /api/trades/:id
 * @desc    Cancel trade
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid trade ID required')]),
  tradeController.cancelTrade
);

export default router;
