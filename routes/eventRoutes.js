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

// 🔓 Public Routes
router.get('/public', getPublicEvents);          // Publicly accessible events
router.get('/updates', getRecentEvents);         // Real-time updates via SSE

// 🔐 Admin Routes
router.get('/admin/list', verifyToken, isAdmin, getEvents);               // Get all events (admin)
router.post('/admin/create', verifyToken, isAdmin, upload.single('image'), createEvent); // Create new event
router.delete('/admin/delete/:id', verifyToken, isAdmin, deleteEvent);    // Delete event by ID

// 📄 Default API base check
router.get('/', (req, res) => res.status(200).json({ message: 'Events API is running' }));

export default router;
