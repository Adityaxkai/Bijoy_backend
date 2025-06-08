import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);

export default router;