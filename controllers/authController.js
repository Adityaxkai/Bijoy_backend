import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import User from '../models/User.js';

const saltRounds = 12;

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        await User.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email.trim());
        
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Handle plaintext passwords in database (migration)
        if (user.password.length < 60) {
            const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
            if (password.trim() !== user.password) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            await User.updatePassword(user.Id, hashedPassword);
        } else {
            const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
        }
        
        const token = jwt.sign(
            { id: user.Id, is_admin: user.is_admin },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );
        
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.Id,
                name: user.name,
                email: user.email,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};