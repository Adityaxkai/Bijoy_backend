
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
import { verifyToken, isAdmin } from './middleware/auth.js';
dotenv.config();
// Initialize app
const app = express();
console.log('Database configuration:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
// Middleware

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Test DB connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    if (!pool) {
      throw new Error('Database pool is not initialized');
    }
    
    const [rows] = await pool.query('SELECT 1 + 1 AS solution, NOW() AS `current_time`');
    console.log('✅ Database query successful:', rows[0]);
    
    res.json({ 
      success: true, 
      result: rows[0].solution,
      timestamp: rows[0].current_time,
      message: 'Database connection is working'
    });
  } catch (err) {
    console.error('❌ Database connection error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Routes
try {
  console.log('Loading authRoutes...');
  const authRoutesModule = await import('./routes/authRoutes.js');
  app.use('/api/auth', authRoutesModule.default);
  console.log('✅ authRoutes loaded successfully');
} catch (error) {
  console.error('❌ Error loading authRoutes:', error.message);
}

try {
  console.log('Loading userRoutes...');
  const userRoutes = await import('./routes/userRoutes.js');
  app.use('/api/users', userRoutes.default);
  console.log('✅ userRoutes loaded successfully');
} catch (error) {
  console.error('❌ Error loading userRoutes:', error.message);
}

try {
  console.log('Loading eventRoutes...');
  const eventRoutes = await import('./routes/eventRoutes.js');
  app.use('/api/events', eventRoutes.default);
  console.log('✅ eventRoutes loaded successfully');
} catch (error) {
  console.error('❌ Error loading eventRoutes:', error.message);
}

try {
  console.log('Loading contactRoutes...');
  const contactRoutes = await import('./routes/contactRoutes.js');
  app.use('/api/contacts', contactRoutes.default);
  console.log('✅ contactRoutes loaded successfully');
} catch (error) {
  console.error('❌ Error loading contactRoutes:', error.message);
}

try{
  console.log("Loading admissionRoutes...");
  const admissionRoutes=await import('./routes/admissionRoutes.js');
  app.use('/api/admission', admissionRoutes.default);
  console.log("✅ admissionRoutes loaded successfully");
}
catch(error){
  console.error('❌ Error loading admissionRoutes:', error.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Bijoy API Server' });
});


// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  
  // Handle specific database errors
  if (err.message.includes('pool') || err.message.includes('database')) {
    return res.status(500).json({ 
      error: 'Database connection error - please check your database configuration',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle MySQL specific errors
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
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
