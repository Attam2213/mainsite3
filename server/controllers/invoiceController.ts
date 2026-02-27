import { Request, Response } from 'express';
import { Invoice, User, Service } from '../models';

export const getAllInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Service, as: 'service', attributes: ['id', 'title'] }
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
        { model: Service, as: 'service', attributes: ['id', 'title'] }
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
