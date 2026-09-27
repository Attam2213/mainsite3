import express from 'express';
import {
  getAllInvoices,
  getUserInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createSubscriptionInvoice,
  patchInvoiceStatus,
  createManualInvoice
} from '../controllers/invoiceController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Admin routes
router.get('/all', authenticateToken, isAdmin, getAllInvoices);
router.post('/', authenticateToken, isAdmin, createInvoice);
router.post('/manual', authenticateToken, isAdmin, createManualInvoice);
router.put('/:id', authenticateToken, isAdmin, updateInvoice);
router.patch('/:id/status', authenticateToken, isAdmin, patchInvoiceStatus);
router.delete('/:id', authenticateToken, isAdmin, deleteInvoice);

// Client routes
router.get('/my', authenticateToken, getUserInvoices);
router.post('/subscription', authenticateToken, createSubscriptionInvoice);

export default router;
