// ═══════════════════════════════════════════════════════════════
// PORTFOLIO ROUTES
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body, param } from 'express-validator';
import { portfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/portfolios
 * @desc    Get all portfolios for current user
 * @access  Private
 */
router.get('/', authenticate, portfolioController.getAllPortfolios);

/**
 * @route   GET /api/portfolios/:id
 * @desc    Get portfolio by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid portfolio ID required')]),
  portfolioController.getPortfolioById
);

/**
 * @route   POST /api/portfolios
 * @desc    Create new portfolio
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate([
    body('name').trim().notEmpty().withMessage('Portfolio name is required'),
    body('description').optional().trim(),
    body('cashBalance')
      .optional()
      .isDecimal()
      .withMessage('Cash balance must be a decimal number'),
  ]),
  portfolioController.createPortfolio
);

/**
 * @route   PUT /api/portfolios/:id
 * @desc    Update portfolio
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid portfolio ID required'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('cashBalance').optional().isDecimal(),
  ]),
  portfolioController.updatePortfolio
);

/**
 * @route   DELETE /api/portfolios/:id
 * @desc    Delete portfolio
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid portfolio ID required')]),
  portfolioController.deletePortfolio
);

/**
 * @route   GET /api/portfolios/:id/history
 * @desc    Get portfolio history
 * @access  Private
 */
router.get(
  '/:id/history',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid portfolio ID required'),
  ]),
  portfolioController.getPortfolioHistory
);

export default router;
