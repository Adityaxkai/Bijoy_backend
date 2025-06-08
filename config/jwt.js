import dotenv from 'dotenv';

dotenv.config();

export default {
  secret: process.env.ACCESS_TOKEN_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h'
};