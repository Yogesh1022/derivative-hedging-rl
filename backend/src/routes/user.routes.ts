// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT ROUTES (Admin)
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validate([
    query('role').optional().isIn(['TRADER', 'ANALYST', 'RISK_MANAGER', 'ADMIN']),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    query('search').optional().trim(),
  ]),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  validate([param('id').isUUID().withMessage('Valid user ID required')]),
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    param('id').isUUID().withMessage('Valid user ID required'),
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['TRADER', 'ANALYST', 'RISK_MANAGER', 'ADMIN']),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  ]),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate([param('id').isUUID().withMessage('Valid user ID required')]),
  userController.deleteUser
);

/**
 * @route   GET /api/users/stats/overview
 * @desc    Get user statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats/overview', authenticate, requireAdmin, userController.getUserStats);

export default router;
