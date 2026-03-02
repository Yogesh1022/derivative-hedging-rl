// ═══════════════════════════════════════════════════════════════
// POSITION ROUTES
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { positionController } from '../controllers/position.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/positions
 * @desc    Get all positions for a portfolio
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate([
    query('portfolioId')
      .optional()
      .isUUID()
      .withMessage('Valid portfolio ID required'),
    query('isClosed').optional().isBoolean(),
  ]),
  positionController.getAllPositions
);

/**
 * @route   GET /api/positions/:id
 * @desc    Get position by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid position ID required')]),
  positionController.getPositionById
);

/**
 * @route   POST /api/positions
 * @desc    Create new position (open trade)
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate([
    body('portfolioId').isUUID().withMessage('Valid portfolio ID required'),
    body('symbol').trim().notEmpty().withMessage('Symbol is required'),
    body('assetType')
      .isIn(['STOCK', 'OPTION', 'FUTURE', 'FOREX', 'CRYPTO'])
      .withMessage('Valid asset type required'),
    body('quantity').isDecimal().withMessage('Quantity must be a decimal number'),
    body('avgPrice').isDecimal().withMessage('Price must be a decimal number'),
    body('currentPrice').isDecimal().withMessage('Current price must be a decimal number'),
    // Optional fields for options
    body('optionType').optional().isIn(['CALL', 'PUT']),
    body('strikePrice').optional().isDecimal(),
    body('expiryDate').optional().isISO8601(),
    body('delta').optional().isDecimal(),
    body('gamma').optional().isDecimal(),
    body('vega').optional().isDecimal(),
    body('theta').optional().isDecimal(),
  ]),
  positionController.createPosition
);

/**
 * @route   PUT /api/positions/:id
 * @desc    Update position
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid position ID required'),
    body('quantity').optional().isDecimal(),
    body('currentPrice').optional().isDecimal(),
    body('delta').optional().isDecimal(),
    body('gamma').optional().isDecimal(),
    body('vega').optional().isDecimal(),
    body('theta').optional().isDecimal(),
  ]),
  positionController.updatePosition
);

/**
 * @route   POST /api/positions/:id/close
 * @desc    Close position
 * @access  Private
 */
router.post(
  '/:id/close',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid position ID required'),
    body('closePrice').isDecimal().withMessage('Close price must be a decimal number'),
  ]),
  positionController.closePosition
);

/**
 * @route   DELETE /api/positions/:id
 * @desc    Delete position
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid position ID required')]),
  positionController.deletePosition
);

export default router;
