import express from 'express';
import { Invoice, User } from '../models/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get invoices
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    let where = {};
    if (user.role !== 'admin') {
      where = { userId: user.id };
    }
    
    const invoices = await Invoice.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create invoice (Admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const invoice = await Invoice.create(req.body);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update invoice
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    // Clients can only update status to 'paid' (simulation)
    if (req.user.role !== 'admin') {
       if (req.body.status === 'paid' && Object.keys(req.body).length === 1) {
         // Allow paying
       } else {
         return res.status(403).json({ message: 'Forbidden' });
       }
    }
    
    await invoice.update(req.body);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    await invoice.destroy();
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
