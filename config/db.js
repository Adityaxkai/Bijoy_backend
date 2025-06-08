import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Log essential env values (safely)
console.log('Environment check:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Validate required DB name
if (!dbConfig.database) {
  console.error('❌ ERROR: DB_NAME is missing in environment variables');
  process.exit(1);
}

// Mask password in logs
console.log('Database configuration:', {
  ...dbConfig,
  password: dbConfig.password ? '[HIDDEN]' : '[EMPTY]'
});

// Create and test connection pool
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created');

  // Test connection
  (async () => {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Connected to database');

      const [rows] = await connection.query('SELECT NOW() AS now');
      console.log('✅ Test query successful:', rows[0]);

      connection.release();
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      console.error('Details:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user
      });
    }
  })();
} catch (err) {
  console.error('❌ Failed to create pool:', err.message);
  process.exit(1);
}

// Export pool
export default pool;
