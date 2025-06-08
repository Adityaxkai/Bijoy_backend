import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Verify environment variables are loaded
console.log('Environment check:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

// Configuration with fallbacks and validation
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Validate required config
if (!dbConfig.database) {
  console.error('ERROR: DB_NAME is required in environment variables');
  process.exit(1);
}

console.log('Database configuration:', {
  ...dbConfig,
  password: dbConfig.password ? '[HIDDEN]' : '[EMPTY]'
});

// Create the pool with error handling
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created successfully');
  
  // Test connection immediately
  (async () => {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Successfully connected to database');
      
      // Test a simple query
      const [rows] = await connection.query('SELECT 1 as test');
      console.log('✅ Database query test successful:', rows[0]);
      
      connection.release();
    } catch (err) {
     console.error('❌ Failed to connect to database:', err.message);
      console.error('Connection details:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user
      });
    }
  })();
  
} catch (err) {
  console.error('❌ Failed to create database pool:', err);
  process.exit(1);
}

// Export the pool
export default pool;