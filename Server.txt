const express = require('express');
const mysql = require('mysql2'); // Using mysql2 for better performance connector
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer= require('multer');
const path= require('path');
const fs = require('fs');
saltRound=12
require('dotenv').config(); // This line reads the .env file


const app = express();
const dbPort = 3309; // MySQL port
const serverPort = 8081; // Server port

// Create connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your password if set
    database: 'test',
    port: dbPort
});

// Connect to database checking 
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database');
});

app.use(cors());
app.use(express.json()); // Add JSON parsing middleware

// default api
app.get('/', (req, res) => {
    return res.json({ message: 'From backend side' });
});

// api users to get the data from the database that is mysql
app.get("/users", (req, res) => {
    const sql = "SELECT * FROM operation_bijoy";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// SSE endpoint
app.get('/updates', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Important for SSE
    
    const sendUpdate = () => {
        db.query(
            'SELECT * FROM operation_bijoy WHERE created_at > NOW() - INTERVAL 5 SECOND',
            (err, newData) => {
                if (err) {
                    console.error('Database error:', err);
                    return;
                }
                if (newData.length > 0) {
                    res.write(`data: ${JSON.stringify(newData)}\n\n`);
                }
            }
        );
    };

    // Initial check
    sendUpdate();
    
    // Periodic checks
    const interval = setInterval(sendUpdate, 5000);
    
    req.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

app.post('/signup',async (req,res)=>{
    const hashedPassword=await bcrypt.hash(req.body.password,saltRound);
    console.log("Original password:", req.body.password);
    console.log("Hashed password:", hashedPassword);
    const sql= "INSERT INTO signup(name,email,password) VALUES(?)";
    const values = [
        req.body.name,
        req.body.email,
       hashedPassword
    ];
    db.query(sql,[values],(err,data)=>{
        if(err) return res.status(500).json(err);
        return res.json(data);
    });
})

app.post('/contactus',(req,res)=>{
    const sql= "INSERT INTO contactus(name,email,message) VALUES(?)";
    const values = [
        req.body.name,
        req.body.email,
        req.body.message
    ];
    db.query(sql,[values],(err,data)=>{
        if(err) return res.status(500).json(err);
        return res.json(data);
    });
})

app.post('/login', async (req, res) => {
    try {
        const sql = "SELECT Id, name, email, password, is_admin FROM signup WHERE email = ?";
        db.query(sql, [req.body.email.trim()], async (err, data) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json(err);
            }

            if (data.length === 0) {
                return res.status(401).json({message: "Invalid credentials"});
            }

            const user = data[0];
            
            // Normalize the password input
            const inputPassword = req.body.password.trim();
            
            // Debug logs
            console.log("Input password:", inputPassword);
            console.log("Stored hash:", user.password);

            // First check if the password is already hashed (might be plaintext in DB)
            if (user.password.length < 60) { // BCrypt hashes are always 60 chars
                // If password is stored plaintext (shouldn't happen), hash it now
                const hashedPassword = await bcrypt.hash(inputPassword, saltRound);
                if (inputPassword === user.password) {
                    // Update the DB with hashed password
                    const updateSql = "UPDATE signup SET password = ? WHERE Id = ?";
                    db.query(updateSql, [hashedPassword, user.Id], (updateErr) => {
                        if (updateErr) console.error("Failed to update password hash:", updateErr);
                    });
                } else {
                    return res.status(401).json({message: "Invalid credentials"});
                }
            } else {
                // Normal bcrypt comparison
                const isPasswordValid = await bcrypt.compare(inputPassword, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({message: "Invalid credentials"});
                }
            }

            const token = jwt.sign(
                {id: user.Id},
                process.env.ACCESS_TOKEN_SECRET,
                {expiresIn: '1h'}
            );
            return res.json({
                message: "Login successful",
                token: token,
                user: {
                  id: user.Id,
                  name: user.name,
                  email: user.email,
                  is_admin: user.is_admin
                }
            });
        });
    } catch (error) {
        console.error("Login process error:", error);
        return res.status(500).json({
            message: "Login process failed",
            error: error.message
        });
    }
});
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log("Authorization header:", req.headers['authorization']);
    if (!token) {
        console.log("No token provided"); 
        return res.status(403).send("A token is required for authentication");}

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log("Token verification failed:", err); 
            return res.status(401).send("Invalid Token");
        }
        console.log("Token decoded successfully, user ID:", decoded.id); 
        req.user = decoded;
        next();
    });
};

app.get('/profile',verifyToken, (req, res) => {
    console.log("User ID from token:", req.user.id);
    const sql = "SELECT name, email, is_admin FROM signup WHERE Id = ?"; 
    db.query(sql, [req.user.id], (err, data) => {
        if (err) {
            console.error("Database error:", err); 
            return res.status(500).json(err);
        }
        if (data.length > 0) {
            console.log("User found:", data[0].email); 
            return res.json(data[0]);
        } else {
            console.log("User not found for ID:", req.user.id); 
            return res.status(404).json({ message: "User not found" });
        }
    });
});

// Update Profile
app.put('/profile', verifyToken, async (req, res) => {
    try {
      const { name, email } = req.body;
      const sql = "UPDATE signup SET name = ?, email = ? WHERE Id = ?";
      db.query(sql, [name, email, req.user.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Profile updated successfully" });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Change Password
  app.post('/change-password', verifyToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // 1. Verify current password
      const userSql = "SELECT password FROM signup WHERE Id = ?";
      db.query(userSql, [req.user.id], async (err, data) => {
        if (err) return res.status(500).json(err);
        
        const isValid = await bcrypt.compare(currentPassword, data[0].password);
        if (!isValid) return res.status(401).json({ message: "Current password is incorrect" });
        
        // 2. Update to new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRound);
        const updateSql = "UPDATE signup SET password = ? WHERE Id = ?";
        db.query(updateSql, [hashedPassword, req.user.id], (err, result) => {
          if (err) return res.status(500).json(err);
          return res.json({ message: "Password changed successfully" });
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
// Get all contact messages (admin only)
app.get('/admin/contacts', verifyToken, (req, res) => {
    // Check if user is admin
    const checkAdminSql = "SELECT is_admin FROM signup WHERE Id = ?";
    db.query(checkAdminSql, [req.user.id], (err, adminData) => {
        if (err) {
            console.error("Admin check error:", err);
            return res.status(500).json({
                message: "Database error during admin check",
                error: err.message
            });
        }
        
        if (!adminData[0]?.is_admin) {
            return res.status(403).json({message: "Admin access required"});
        }
        
        // Fix the contacts query
        const sql = "SELECT id, name, email, message FROM contactus ORDER BY id DESC";
        db.query(sql, (err, contactsData) => {
            if (err) {
                console.error("Contacts query error:", err);
                return res.status(500).json({
                    message: "Database error fetching contacts",
                    error: err.message
                });
            }
            return res.json(contactsData);
        });
    });
});
  
  // Delete contact message
  app.delete('/admin/contacts/:id', verifyToken, (req, res) => {
    const checkAdminSql = "SELECT is_admin FROM signup WHERE Id = ?";
    db.query(checkAdminSql, [req.user.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (!data[0]?.is_admin) return res.status(403).json({message: "Admin access required"});
      
      const sql = "DELETE FROM contactus WHERE id = ?";
      db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({message: "Message deleted"});
      });
    });
  });
  
  // Events endpoints
  app.get('/admin/events', verifyToken, (req, res) => {
    const checkAdminSql = "SELECT is_admin FROM signup WHERE Id = ?";
    db.query(checkAdminSql, [req.user.id], (err, data) => {
        if (err) {
            console.error("Admin check error:", err);
            return res.status(500).json({message: "Database error", error: err});
        }
        
        if (!data[0]?.is_admin) {
            return res.status(403).json({message: "Admin access required"});
        }
        
        const sql = "SELECT * FROM operation_bijoy ORDER BY date DESC";
        db.query(sql, (err, data) => {
            if (err) {
                console.error("Events query error:", err);
                return res.status(500).json({message: "Database error", error: err});
            }
            return res.json(data);
        });
    });
});
  
// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload=multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Check if the file is an image
        if (mimetype && extname) {
          return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});
// Serve static files
app.use('/public', express.static('public'));



app.post('/admin/events', upload.single('image'), verifyToken, (req, res) => {
    const checkAdminSql = "SELECT is_admin FROM signup WHERE Id = ?";
    db.query(checkAdminSql, [req.user.id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (!data[0]?.is_admin) return res.status(403).json({message: "Admin access required"});
        
        const { title, comment, date } = req.body;
        const imagePath = req.file ? `/public/uploads/${req.file.filename}` : null;
        
        const sql = `INSERT INTO operation_bijoy 
                    (image_path, title, comment, date) VALUES (?, ?, ?, ?)`;
        
        db.query(sql, [imagePath, title, comment, date], (err, result) => {
            if (err) return res.status(500).json(err);
            
            // Get the complete inserted record
            const getSql = "SELECT * FROM operation_bijoy WHERE id = ?";
            db.query(getSql, [result.insertId], (err, newEvent) => {
                if (err) return res.status(500).json(err);
                return res.json(newEvent[0]); // Return the complete event
            });
        });
    });
});
  
  //add cleanup function to delete the image from the server
  app.delete('/admin/events/:id', verifyToken, (req, res) => {
    const checkAdminSql = "SELECT is_admin FROM signup WHERE Id = ?";
    db.query(checkAdminSql, [req.user.id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (!data[0]?.is_admin) return res.status(403).json({message: "Admin access required"});
        
        // First, get the image path from the database
        const getSql = "SELECT image_path FROM operation_bijoy WHERE id = ?";
        db.query(getSql, [req.params.id], (err, result) => {
            if (err) return res.status(500).json(err);
            
            // Delete the file if exists
            if (result[0]?.image_path) {
                // Correct the file path construction
                const filePath = path.join(__dirname, 'public', result[0].image_path.replace('/public/', ''));
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                    // Continue even if file deletion fails
                });
            }

            // Now delete the record from the database
            const deleteSql = "DELETE FROM operation_bijoy WHERE id = ?";
            db.query(deleteSql, [req.params.id], (err, deleteResult) => {
                if (err) return res.status(500).json(err);
                return res.json({message: "Event deleted"});
            });
        });
    });
});
app.listen(serverPort, () => {
    console.log(`Server is running on port ${serverPort}`);
});




// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const filePath = `uploads/${req.file.filename}`;
    return res.json({ message: 'File uploaded successfully', filePath });
});
