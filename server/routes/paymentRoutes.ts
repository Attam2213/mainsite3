import express from 'express';
import { Invoice, User, Project, GameServer, ServerNode } from '../models';
import { authenticateToken } from '../middleware/auth';
import { plategaService } from '../services/PlategaService';
import { execCommand, startPM2Process } from '../services/sshService';
import { decrypt } from '../utils/crypto';
import { applyGameServerPaidInvoice } from '../controllers/gameServerController';
import { applyWebSitePaidInvoice } from '../controllers/webSiteController';
import { adjustBalance, getBalance, round2 } from '../services/balanceService';
import { Request, Response } from 'express';

const router = express.Router();

async function applyPostPaidInvoice(invoice: any) {
  if (!invoice) return;
  if (invoice.type === 'monthly' && invoice.projectId) {
    try {
      const project = await Project.findByPk(invoice.projectId);
      if (project) {
        let startDate = new Date();
        const cur = (project as any).paidUntil ? new Date((project as any).paidUntil) : null;
        if (cur && cur > startDate) startDate = cur;
        const months = Number(invoice.periodMonths) || 1;
        const newPaidUntil = new Date(startDate);
        newPaidUntil.setMonth(newPaidUntil.getMonth() + months);
        (project as any).paidUntil = newPaidUntil;
        await project.save();
        await startPM2Process(project);
      }
    } catch (e) { console.error('postpaid apply project error', e); }
  }
  if (invoice.type === 'monthly' && invoice.gameServerId) {
    try { await applyGameServerPaidInvoice(invoice); } catch (e) { console.error('postpaid apply gs error', e); }
  }
  if (invoice.siteId) {
    try { await applyWebSitePaidInvoice(invoice); } catch (e) { console.error('postpaid apply site error', e); }
  }
}

// Create payment for invoice
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { invoiceId, paymentMethod = 2 } = req.body as { invoiceId: string; paymentMethod?: number }; // Default to SBP (2)
    const origin = req.get('origin') || req.get('referer') || '';
    const baseUrl =
      process.env.FRONTEND_URL ||
      (typeof origin === 'string' && origin.startsWith('http') ? origin.replace(/\/+$/, '') : '') ||
      'http://localhost:5173';

    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const isAdmin: boolean = req.user.role === 'admin';

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.userId !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const amount = round2(Number(invoice.amount) || 0);

    // 1) BALANCE FIRST: try to charge from internal balance if sufficient
    if (!isAdmin) {
      const balUser = await User.findByPk(invoice.userId, { attributes: ['id', 'balance'] });
      const userBal = round2(balUser?.balance ?? 0);
      if (userBal >= amount - 0.001) {
        try {
          const { newBalance } = await adjustBalance({
            userId: invoice.userId,
            amount: -amount,
            type: 'withdraw',
            description: invoice.title || `Оплата счета #${invoice.id}`,
            invoiceId: invoice.id,
            gameServerId: invoice.gameServerId || undefined,
            projectId: invoice.projectId || undefined,
            metadata: { source: 'balance_pay_now' },
          });
          invoice.status = 'paid';
          await invoice.save();
          await applyPostPaidInvoice(invoice);
          return res.json({ paid: true, balanceAfter: Number(newBalance.toFixed(2)), paidWithBalance: true });
        } catch (wb: any) {
          console.error('Balance-first charge failed (fallback to Platega):', wb?.message || wb);
          // Fall through to Platega payment creation below
        }
      }
      // If user has insufficient balance — do NOT return 402 here, fall through to Platega instead.
      // Frontend will get the redirect URL and show card/SBP payment screen.
    }

    // 2) FALLBACK: Platega redirect (insufficient balance, admin order, or balance charge failed)
    const result = await plategaService.createPayment({
      paymentMethod,
      paymentDetails: {
        amount,
        currency: 'RUB'
      },
      description: `Invoice #${invoice.id} payment`,
      return: `${baseUrl}/client/invoices?success=true&invoiceId=${invoice.id}`,
      failedUrl: `${baseUrl}/client/invoices?success=false&invoiceId=${invoice.id}`,
      payload: invoice.id
    });

    if (result.success && result.data) {
      try {
        (invoice as any).externalTransactionId = result.data.transactionId || null;
        await invoice.save();
      } catch {}
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
    const rawBody: Buffer | undefined = (req as any).rawBody;
    const rawBodyStr = rawBody ? rawBody.toString('utf8') : JSON.stringify(req.body);

    // Verify HMAC signature if header present (header names: X-Signature / X-Sign)
    const sigHeader =
      req.header('X-Signature') ||
      req.header('X-Sign') ||
      req.header('x-signature') ||
      req.header('x-sign');
    if (sigHeader) {
      const ok = plategaService.verifyWebhookSignature(rawBodyStr, sigHeader);
      if (!ok) {
        console.warn(`[Platega webhook] HMAC signature MISMATCH; payload=${rawBodyStr.slice(0, 200)}`);
        return res.status(401).json({ success: false, error: 'invalid_signature' });
      }
      console.log('[Platega webhook] HMAC signature verified');
    } else {
      console.warn('[Platega webhook] No X-Signature/X-Sign header received — skipping signature verify.');
    }

    console.log('Webhook received:', rawBodyStr);

    const body = req.body as any;
    const transaction = body?.transaction || {};
    const transactionId =
      String(body?.transactionId || transaction?.id || transaction?.transactionId || '').trim() ||
      null;
    const invoiceId =
      String(body?.payload || transaction?.payload || body?.invoiceId || '').trim() ||
      null;
    const currentStatus =
      String(body?.status || transaction?.status || '').toUpperCase() || 'UNKNOWN';

    const paidStates = new Set(['CONFIRMED', 'PAID', 'SUCCESS', 'COMPLETED', 'SUCCESSFUL']);
    const isPaid = paidStates.has(currentStatus);

    if (invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);
      if (invoice) {
        try {
          (invoice as any).externalTransactionId = transactionId || (invoice as any).externalTransactionId || null;
          (invoice as any).externalPayload = rawBodyStr.slice(0, 10000);
          await invoice.save();
        } catch {}

        if (isPaid && invoice.status !== 'paid') {
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
                  metadata: { source: 'platega_webhook', txId: transactionId || null },
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
              let startDate = new Date();
              const projectAny = project as any;
              if (projectAny.paidUntil && new Date(projectAny.paidUntil) > startDate) {
                startDate = new Date(projectAny.paidUntil);
              }
              const monthsToAdd = (invoice as any).periodMonths || 1;
              const newPaidUntil = new Date(startDate);
              newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsToAdd);
              projectAny.paidUntil = newPaidUntil;
              await project.save();
              console.log(`Project ${project.id} subscription extended by ${monthsToAdd} months until ${newPaidUntil}`);
              await startPM2Process(project);
            }
          }

          if ((invoice as any).type === 'monthly' && (invoice as any).gameServerId) {
            try {
              await applyGameServerPaidInvoice(invoice);
            } catch (err) {
              console.error('Error applying paid invoice to game server:', err);
            }
          }
          if ((invoice as any).siteId) {
            try { await applyWebSitePaidInvoice(invoice); } catch (e) { console.error('applyWebSitePaidInvoice webhook error', e); }
          }
        } else if (invoice.status === 'paid') {
          console.log(`Invoice ${invoiceId} is already paid`);
        } else {
          console.log(`Webhook: invoice ${invoiceId} status=${currentStatus} isPaid=${isPaid} — skip`);
        }
      } else {
        console.log(`Invoice ${invoiceId} not found`);
      }
    } else {
      console.log(`Webhook ignored: no invoiceId in payload; status=${currentStatus}`);
    }

    // Always 200 OK as per Platega requirements
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still respond 200 OK to avoid retries storm, but mark failed
    res.status(200).json({ success: false, error: 'server_error_logged' });
  }
});

export default router;
