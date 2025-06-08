import express from 'express';
import { verifyToken,isAdmin } from '../middleware/auth.js';
import {
    createAdmission,
    getAdmissions,
    deleteAdmission

}from '../controllers/admissionController.js';
const router = express.Router();

//public routes
router.post('/',createAdmission);

//Admin routes
router.get('/admin/list', verifyToken, isAdmin, getAdmissions);
router.delete('/admin/delete/:id', verifyToken, isAdmin, deleteAdmission);

router.get('/',(req,res)=>{res.status(201).json({message:"Welcome to admission API"})});

export default router;
