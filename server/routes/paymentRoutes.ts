import express from 'express';
import { Invoice, User, Project } from '../models';
import { authenticateToken } from '../middleware/auth';
import { plategaService } from '../services/PlategaService';
import { startPM2Process } from '../services/sshService';

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
    console.log('Webhook received:', JSON.stringify(req.body));

    const { status, payload, transaction } = req.body;
    
    // Extract invoiceId from payload (sent during creation)
    // If payload is not at top level, check if it's inside transaction
    let invoiceId = payload;
    if (!invoiceId && transaction && transaction.payload) {
        invoiceId = transaction.payload;
    }

    // Check status
    // Docs say: PENDING, CANCELED, CONFIRMED, CHARGEBACKED
    let isPaid = false;
    const currentStatus = status || (transaction && transaction.status);
    
    if (currentStatus === 'CONFIRMED' || currentStatus === 'paid' || currentStatus === 'success') {
      isPaid = true;
    }

    if (isPaid && invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);
      if (invoice && invoice.status !== 'paid') {
        invoice.status = 'paid';
        await invoice.save();
        console.log(`Invoice ${invoiceId} marked as paid via webhook`);

        // Handle Subscription Logic
        if (invoice.type === 'monthly' && invoice.projectId) {
            const project = await Project.findByPk(invoice.projectId);
            if (project) {
                // Determine start date
                let startDate = new Date();
                if (project.paidUntil && new Date(project.paidUntil) > startDate) {
                    startDate = new Date(project.paidUntil);
                }
                
                // Add months
                const monthsToAdd = invoice.periodMonths || 1;
                const newPaidUntil = new Date(startDate);
                newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsToAdd);
                
                project.paidUntil = newPaidUntil;
                await project.save();
                console.log(`Project ${project.id} subscription extended by ${monthsToAdd} months until ${newPaidUntil}`);
                
                // Restart PM2 process
                await startPM2Process(project);
            }
        }
      } else if (invoice) {
        console.log(`Invoice ${invoiceId} is already paid`);
      } else {
        console.log(`Invoice ${invoiceId} not found`);
      }
    } else {
      console.log(`Webhook ignored: status=${currentStatus}, invoiceId=${invoiceId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
});

export default router;