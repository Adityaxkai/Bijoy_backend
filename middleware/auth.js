import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import pool from '../config/db.js';

// Middleware: Verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: 'Access denied: No token provided' });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware: Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(400).json({ message: 'User ID missing from token' });
    }

    if (!pool) {
      throw new Error('Database connection not available');
    }

    const [rows] = await pool.query(
      'SELECT is_admin FROM signup WHERE Id = ?',
      [req.user.id]
    );

    if (!rows.length || !rows[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err.message);
    res.status(500).json({
      error: 'Internal server error while checking admin status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
