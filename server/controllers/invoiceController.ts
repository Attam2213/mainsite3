import { Request, Response } from 'express';
import { Invoice, User, Service, Project, GameServer } from '../models';
import { applyGameServerPaidInvoice } from './gameServerController';
import { adjustBalance, round2 } from '../services/balanceService';

export const getAllInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Service, as: 'service', attributes: ['id', 'title'] },
        { model: Project, as: 'project', attributes: ['id', 'title'] },
        { model: GameServer, as: 'gameServer', attributes: ['id', 'name', 'game', 'port'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Ошибка при получении счетов' });
  }
};

export const getUserInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const invoices = await Invoice.findAll({
      where: { userId },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title'] },
        { model: Project, as: 'project', attributes: ['id', 'title'] },
        { model: GameServer, as: 'gameServer', attributes: ['id', 'name', 'game', 'port'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    console.error('Get user invoices error:', error);
    res.status(500).json({ message: 'Ошибка при получении счетов' });
  }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Ошибка при создании счета' });
  }
};

export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findByPk(req.params.id as string);
    if (!invoice) {
      res.status(404).json({ message: 'Счет не найден' });
      return;
    }
    await invoice.update(req.body);
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении счета' });
  }
};

export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findByPk(req.params.id as string);
    if (!invoice) {
      res.status(404).json({ message: 'Счет не найден' });
      return;
    }
    await invoice.destroy();
    res.json({ message: 'Счет удален' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Ошибка при удалении счета' });
  }
};

export const createSubscriptionInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, months } = req.body;
    const project = await Project.findByPk(projectId);
    if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
    }
    
    // @ts-ignore
    const userId = req.user.id;
    
    // Use monthlyRate if available, otherwise budget (fallback)
    const monthlyPrice = project.monthlyRate > 0 ? project.monthlyRate : project.budget;
    const amount = monthlyPrice * months;

    // @ts-ignore
    const isAdmin: boolean = req.user.role === 'admin';
    if (!isAdmin) {
      const u = await User.findByPk(userId, { attributes: ['id', 'balance'] });
      const userBal = round2(u?.balance ?? 0);
      if (userBal < amount - 0.001) {
        res.status(402).json({
          message: 'Недостаточно средств на балансе',
          balance: userBal,
          totalAmount: amount,
          needed: round2(amount - userBal),
        });
        return;
      }
    }
    
    const invoice = await Invoice.create({
        title: `Продление подписки: ${project.title} (${months} мес.)`,
        amount,
        status: 'pending',
        type: 'monthly',
        dueDate: new Date(),
        userId,
        projectId: project.id,
        periodMonths: months
    });

    if (!isAdmin) {
      try {
        await adjustBalance({
          userId,
          amount: -round2(amount),
          type: 'withdraw',
          description: invoice.title,
          invoiceId: invoice.id,
        });
      } catch (wb: any) {
        res.status(402).json({ message: wb.message || 'Недостаточно средств' });
        return;
      }
      invoice.status = 'paid';
      await invoice.save();
      // Extend project.paidUntil
      let startDate = new Date();
      if (project.paidUntil && new Date(project.paidUntil as any) > startDate) {
        startDate = new Date(project.paidUntil as any);
      }
      startDate.setMonth(startDate.getMonth() + months);
      (project as any).paidUntil = startDate;
      await project.save();
      res.status(201).json({ ...invoice.toJSON(), paidWithBalance: true });
      return;
    }
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create subscription invoice error:', error);
    res.status(500).json({ message: 'Ошибка при создании счета подписки' });
  }
};

export const patchInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body as { status?: string };
    if (!status || !['paid', 'pending', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Allowed: paid | pending | cancelled' });
      return;
    }
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      res.status(404).json({ message: 'Счет не найден' });
      return;
    }
    const oldStatus = invoice.status;
    invoice.status = status as any;
    await invoice.save();

    if (status === 'paid' && oldStatus !== 'paid' && invoice.type === 'monthly' && invoice.gameServerId) {
      try {
        await applyGameServerPaidInvoice(invoice);
      } catch (err) {
        console.error('Admin patch provision error:', err);
      }
    }
    res.json(invoice);
  } catch (error) {
    console.error('Patch invoice status error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении статуса счета' });
  }
};

export const createManualInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, gameServerId, projectId, amount, title, periodMonths, type, dueDate } = req.body as any;
    if (!userId || !amount || !title) {
      res.status(400).json({ message: 'Обязательные поля: userId, amount, title' });
      return;
    }
    const safeAmount = Math.max(0, Number(amount) || 0);
    const invoice = await Invoice.create({
      userId,
      gameServerId: gameServerId || null,
      projectId: projectId || null,
      title: String(title),
      amount: safeAmount,
      status: 'pending',
      type: (type && String(type)) || 'one_time',
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      periodMonths: Math.max(0, Math.min(12, Number(periodMonths) || 1))
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create manual invoice error:', error);
    res.status(500).json({ message: 'Ошибка при ручном создании счета' });
  }
};
