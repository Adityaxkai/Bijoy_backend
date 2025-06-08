import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { 
    getEvents, 
    createEvent, 
    deleteEvent,
    getRecentEvents,
    getPublicEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicEvents); 
router.get('/updates', getRecentEvents);

// Admin routes
router.get('/admin/list', verifyToken, isAdmin, getEvents);
router.post('/admin/create', verifyToken, isAdmin, upload.single('image'), createEvent);
router.delete('/admin/delete/:id', verifyToken, isAdmin, deleteEvent);

// Fallback route
router.get('/', (req, res) => res.status(200).json({ message: 'Events API' }));

export default router;