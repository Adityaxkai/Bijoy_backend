export const handleErrors = (err, req, res, next) => {
    console.error(err.stack);
    
    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max 5MB allowed.' });
    }
    
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: err.message });
    }
    
    // Default error response
    res.status(500).json({ error: 'Something went wrong!' });
};

export const validateInput = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};