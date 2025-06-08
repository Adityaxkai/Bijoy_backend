import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { 
  createContact, 
  getContacts, 
  deleteContact 
} from '../controllers/contactController.js';

const router = express.Router();

// Public route
router.post('/submit', createContact);

// Admin routes
router.get('/admin/list', verifyToken, isAdmin, getContacts);
router.delete('/admin/delete/:id', verifyToken, isAdmin, deleteContact);

// Fallback route
router.get('/', (req, res) => res.status(200).json({ message: 'Contacts API' }));

export default router;