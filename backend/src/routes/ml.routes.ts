// ═══════════════════════════════════════════════════════════════
// ML ROUTES
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body } from 'express-validator';
import { mlController } from '../controllers/ml.controller';
import { authenticate, requireTrader, requireRiskManager } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/ml/health
 * @desc    Check ML service health
 * @access  Private
 */
router.get('/health', authenticate, mlController.healthCheck);

/**
 * @route   GET /api/ml/model-info
 * @desc    Get ML model information
 * @access  Private
 */
router.get('/model-info', authenticate, mlController.getModelInfo);

/**
 * @route   POST /api/ml/predict
 * @desc    Get risk prediction for portfolio
 * @access  Private (Trader, Analyst, Risk Manager, Admin)
 */
router.post(
  '/predict',
  authenticate,
  requireTrader,
  validate([
    body('portfolioId').isUUID().withMessage('Valid portfolio ID required'),
  ]),
  mlController.predictRisk
);

/**
 * @route   POST /api/ml/recommend-hedge
 * @desc    Get hedging recommendation
 * @access  Private (Trader, Analyst, Risk Manager, Admin)
 */
router.post(
  '/recommend-hedge',
  authenticate,
  requireTrader,
  validate([
    body('portfolioId').isUUID().withMessage('Valid portfolio ID required'),
  ]),
  mlController.getHedgingRecommendation
);

/**
 * @route   POST /api/ml/batch-predict
 * @desc    Batch risk prediction for multiple portfolios
 * @access  Private (Risk Manager, Admin only)
 */
router.post(
  '/batch-predict',
  authenticate,
  requireRiskManager,
  validate([
    body('portfolioIds')
      .isArray({ min: 1 })
      .withMessage('At least one portfolio ID required'),
    body('portfolioIds.*').isUUID().withMessage('All portfolio IDs must be valid UUIDs'),
  ]),
  mlController.batchPredict
);

export default router;
