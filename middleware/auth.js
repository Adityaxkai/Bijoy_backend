import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import pool from '../config/db.js';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        // Verify pool connection first
        if (!pool) {
            throw new Error('Database connection not established');
        }

        const [rows] = await pool.query(
            "SELECT is_admin FROM signup WHERE Id = ?", 
            [req.user.id]
        );
        
        if (!rows[0]?.is_admin) {
            return res.status(403).json({message: "Admin access required"});
        }
        
        next();
    } catch (err) {
        console.error('Admin check error:', err);
        return res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};