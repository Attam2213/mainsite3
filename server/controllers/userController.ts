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

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body as { role?: string };
    if (!role || !['client', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role. Allowed: client | admin' });
      return;
    }
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }
    // @ts-ignore
    user.role = role;
    await user.save();
    // return without password
    const { password, ...rest } = (user as any).toJSON();
    res.json(rest);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении роли пользователя' });
  }
};
