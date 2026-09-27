import express from 'express';
import { Invoice, User, Project, GameServer, ServerNode } from '../models';
import { authenticateToken } from '../middleware/auth';
import { plategaService } from '../services/PlategaService';
import { execCommand, startPM2Process } from '../services/sshService';
import { decrypt } from '../utils/crypto';
import { applyGameServerPaidInvoice } from '../controllers/gameServerController';
import { adjustBalance } from '../services/balanceService';
import { Request, Response } from 'express';

const router = express.Router();

// Create payment for invoice
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { invoiceId, paymentMethod = 2 } = req.body as { invoiceId: string; paymentMethod?: number }; // Default to SBP (2)
    const origin = req.get('origin') || req.get('referer') || '';
    const baseUrl =
      process.env.FRONTEND_URL ||
      (typeof origin === 'string' && origin.startsWith('http') ? origin.replace(/\/+$/, '') : '') ||
      'http://localhost:5173';

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
      return: `${baseUrl}/client/invoices?success=true&invoiceId=${invoice.id}`,
      failedUrl: `${baseUrl}/client/invoices?success=false&invoiceId=${invoice.id}`,
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
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body));

    const { status, payload, transaction } = req.body as unknown as {
      status?: string;
      payload?: string;
      transaction?: { payload?: string; status?: string };
    };
    
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

        // Deposit top-up (wallet)
        const title = String(invoice.title || '');
        if (invoice.type === 'one_time' && /пополнени|баланс|deposit|wallet/i.test(title)) {
          try {
            const amt = Number(invoice.amount) || 0;
            if (amt > 0) {
              const { newBalance } = await adjustBalance({
                userId: invoice.userId,
                amount: +Math.round(amt * 100) / 100,
                type: 'deposit',
                description: title || 'Пополнение через Platega',
                invoiceId: invoice.id,
                metadata: { source: 'platega_webhook' },
              });
              console.log(`Wallet deposited +${amt} for user ${invoice.userId} => new balance=${newBalance}`);
            }
          } catch (wb: any) {
            console.error('Webhook wallet deposit error:', wb?.message || wb);
          }
        }

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

        if (invoice.type === 'monthly' && invoice.gameServerId) {
            try {
                await applyGameServerPaidInvoice(invoice);
            } catch (err) {
                console.error('Error applying paid invoice to game server:', err);
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
