import { Request, Response } from 'express';
import PortfolioItem from '../models/PortfolioItem';

export const getAllPortfolioItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await PortfolioItem.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении работ портфолио' });
  }
};

export const getPortfolioItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findByPk(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Работа не найдена' });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении работы' });
  }
};

export const createPortfolioItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании работы' });
  }
};

export const updatePortfolioItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findByPk(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Работа не найдена' });
      return;
    }
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении работы' });
  }
};

export const deletePortfolioItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findByPk(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Работа не найдена' });
      return;
    }
    await item.destroy();
    res.json({ message: 'Работа удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении работы' });
  }
};
