import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';

// Middleware
import { verifyToken, isAdmin } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// ES module fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://bijoyinstitutegiridih.com',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test DB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution, NOW() AS `current_time`');
    res.json({ 
      success: true, 
      result: rows[0].solution,
      timestamp: rows[0].current_time,
      message: 'Database connection is working'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admission', admissionRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Bijoy API Server' });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);

  if (err.message.includes('pool') || err.message.includes('database')) {
    return res.status(500).json({
      error: 'Database connection error - please check your database configuration',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({
      error: 'Database access denied - check credentials',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      error: 'Database connection refused - is MySQL running?',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.SERVER_PORT || 8081;
app.listen(PORT, () => {
  console.log(`🎉 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 API Base URL: https://bijoy-backend-jgtr.onrender.com/api`);
});
