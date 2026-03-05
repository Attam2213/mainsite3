import express from 'express';
import { Invoice, User } from '../models';
import { authenticateToken } from '../middleware/auth';
import { plategaService } from '../services/PlategaService';

const router = express.Router();

// Create payment for invoice
router.post('/create', authenticateToken, async (req: any, res: any) => {
  try {
    const { invoiceId, paymentMethod = 2 } = req.body; // Default to SBP (2)

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const result = await plategaService.createPayment({
      paymentMethod,
      paymentDetails: {
        amount: invoice.amount,
        currency: 'RUB'
      },
      description: `Invoice #${invoice.id} payment`,
      return: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/invoices?success=true&invoiceId=${invoice.id}`,
      failedUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/invoices?success=false&invoiceId=${invoice.id}`,
      payload: invoice.id
    });

    if (result.success && result.data) {
      res.json({ url: result.data.url });
    } else {
      res.status(500).json({ message: result.error || 'Failed to create payment' });
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Webhook
router.post('/webhook', async (req, res) => {
  try {
    // Verify signature if needed (Platega docs usually specify how)
    // For now, trust payload
    const { transactionId, status, payload } = req.body;
    
    // payload contains invoiceId
    const invoiceId = payload;

    if (status === 'success' || status === 'paid') { // Check actual status values from docs
      const invoice = await Invoice.findByPk(invoiceId);
      if (invoice && invoice.status !== 'paid') {
        invoice.status = 'paid';
        await invoice.save();
        console.log(`Invoice ${invoiceId} marked as paid via webhook`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
});

export default router;