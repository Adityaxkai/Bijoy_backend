import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/userController.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', verifyToken, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, updateProfile);

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', verifyToken, changePassword);

export default router;
