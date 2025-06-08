import Event from '../models/Event.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js'

if (!pool) {
    throw new Error('Database connection not established');
}
// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPublicEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createEvent = async (req, res) => {
    try {
        const { title, comment, date } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }
        
        const imagePath = `/public/uploads/${req.file.filename}`;
        
        const result = await Event.create({ 
            image_path: imagePath, 
            title, 
            comment, 
            date 
        });
        
        const newEvent = await Event.getById(result.insertId);
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const imagePath = await Event.getImagePath(eventId);
        
        // Delete file if exists
        if (imagePath) {
            const fullPath = path.join(__dirname, 'public', imagePath.replace('/public/', ''));
            fs.unlink(fullPath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        
        await Event.delete(eventId);
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRecentEvents = async (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        
        const sendUpdate = async () => {
            try {
                const events = await Event.getRecent();
                if (events.length > 0) {
                    res.write(`data: ${JSON.stringify(events)}\n\n`);
                }
            } catch (err) {
                console.error('SSE Error:', err);
            }
        };
        
        // Initial check
        await sendUpdate();
        
        // Periodic checks every 5 seconds
        const interval = setInterval(sendUpdate, 5000);
        
        req.on('close', () => {
            clearInterval(interval);
            console.log('Client disconnected from SSE');
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};