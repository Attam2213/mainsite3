import { Request, Response } from 'express';
import User from '../models/User';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Ошибка при получении пользователей' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id as string, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователя' });
  }
};
