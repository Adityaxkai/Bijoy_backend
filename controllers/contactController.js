import Contact from '../models/Contact.js';
import pool from '../config/db.js'

if (!pool) {
    throw new Error('Database connection not established');
}
// Create a new contact message
export const createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }
    
    const result = await Contact.create({ name, email, message });
    res.status(201).json({ 
      message: 'Contact message sent successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ 
      error: 'Failed to send contact message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all contact messages (Admin only)
export const getContacts = async (req, res) => {
  try {
    console.log('Attempting to fetch contacts...');
    const contacts = await Contact.getAll();
    console.log('Successfully fetched contacts:', contacts.length);
    res.json(contacts);
  } catch (error) {
    console.error('Detailed controller error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch contact messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      dbError: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlMessage: error.sqlMessage 
      } : undefined
    });
  }
};

// Delete a contact message (Admin only)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid contact ID is required' });
    }
    
    const result = await Contact.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }
    
    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete contact message',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};