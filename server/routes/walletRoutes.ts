import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/auth';
import User from '../models/User';
import Invoice from '../models/Invoice';
import { adjustBalance, getBalance, listTransactions, MIN_DEPOSIT, round2 } from '../services/balanceService';
import { plategaService } from '../services/PlategaService';

const router = express.Router();

router.get('/balance', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const balance = await getBalance(userId);
    res.json({ balance: Number(balance.toFixed(2)), currency: 'RUB' });
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: error.message || 'Ошибка получения баланса' });
  }
});

router.get('/transactions', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const isA: boolean = req.user.role === 'admin';
    // @ts-ignore
    const clientId: string = req.user.id;
    const query = req.query as any;
    const filter: any = {
      clientId: isA ? undefined : clientId,
      userId: isA && query.userId ? String(query.userId) : undefined,
      type: query.type || undefined,
      limit: Number(query.limit) || 20,
      offset: Number(query.offset) || 0,
    };
    const { count, rows } = await listTransactions(filter);
    res.json({ count, rows });
  } catch (error: any) {
    console.error('List transactions error:', error);
    res.status(500).json({ message: error.message || 'Ошибка получения транзакций' });
  }
});

router.post('/deposit/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const user = req.user;
    const body = req.body as { amount: number };
    const amount = round2(body.amount);
    if (!Number.isFinite(amount) || amount < MIN_DEPOSIT) {
      res.status(400).json({ message: `Минимум пополнения ${MIN_DEPOSIT} ₽` });
      return;
    }
    const invoice = await Invoice.create({
      title: `Пополнение баланса на ${amount.toFixed(0)} ₽`,
      amount,
      status: 'pending',
      type: 'one_time',
      dueDate: new Date(),
      userId,
    });
    const origin = req.get('origin') || req.get('referer') || '';
    const baseUrl =
      process.env.FRONTEND_URL ||
      (typeof origin === 'string' && origin.startsWith('http') ? origin.replace(/\/+$/, '') : '') ||
      'http://localhost:5173';
    const returnUrl = `${baseUrl}/client/dashboard?wallet=1&success=true&invoiceId=${invoice.id}`;
    const failUrl = `${baseUrl}/client/dashboard?wallet=1&success=false&invoiceId=${invoice.id}`;
    const result = await plategaService.createPayment({
      paymentMethod: 2,
      paymentDetails: { amount, currency: 'RUB' },
      description: invoice.title,
      return: returnUrl,
      failedUrl: failUrl,
      payload: invoice.id,
    });
    if (result.success && result.data) {
      try {
        (invoice as any).externalTransactionId = result.data.transactionId || null;
        await invoice.save();
      } catch {}
      res.json({ url: result.data.url, invoiceId: invoice.id, amount });
    } else {
      res.status(500).json({ message: result.error || 'Failed to create Platega payment' });
    }
  } catch (error: any) {
    console.error('Deposit create error:', error);
    res.status(500).json({ message: error.message || 'Internal error' });
  }
});

router.post('/admin/adjust', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const adminUserId = req.user.id;
    const body = req.body as { userId: string; amount: number; type?: 'deposit' | 'withdraw' | 'adjust'; comment?: string };
    if (!body.userId) {
      res.status(400).json({ message: 'userId required' });
      return;
    }
    const amount = round2(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      res.status(400).json({ message: 'Нужна ненулевая сумма' });
      return;
    }
    let type: any = body.type;
    if (!type || (type !== 'deposit' && type !== 'withdraw' && type !== 'adjust')) {
      type = amount > 0 ? 'deposit' : 'withdraw';
    }
    const u = await User.findByPk(body.userId);
    if (!u) { res.status(404).json({ message: 'Пользователь не найден' }); return; }
    const { transaction, newBalance } = await adjustBalance({
      userId: body.userId,
      amount,
      type,
      description: body.comment || (amount > 0 ? 'Ручное начисление' : 'Ручное списание'),
      metadata: { manualBy: adminUserId, comment: body.comment || null },
    });
    res.json({ balance: Number(newBalance.toFixed(2)), transaction });
  } catch (error: any) {
    console.error('Admin adjust error:', error);
    res.status(400).json({ message: error.message || 'Ошибка корректировки баланса' });
  }
});

export default router;
