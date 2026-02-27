import express from 'express';
import {
  getAllInvoices,
  getUserInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from '../controllers/invoiceController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Admin routes
router.get('/all', authenticateToken, isAdmin, getAllInvoices);
router.post('/', authenticateToken, isAdmin, createInvoice);
router.put('/:id', authenticateToken, isAdmin, updateInvoice);
router.delete('/:id', authenticateToken, isAdmin, deleteInvoice);

// Client routes
router.get('/my', authenticateToken, getUserInvoices);

export default router;
