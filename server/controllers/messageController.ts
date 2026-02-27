import { Request, Response } from 'express';
import { Message, User } from '../models';
import { Op } from 'sequelize';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { orderId } = req.params;
    
    // Mark unread messages from other users as read
    await Message.update(
      { isRead: true },
      {
        where: {
          orderId,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    const messages = await Message.findAll({
      where: { orderId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'role'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Ошибка при получении сообщений' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { orderId } = req.params;
    const { content } = req.body;

    const message = await Message.create({
      orderId,
      senderId: userId,
      content
    });

    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'role'] }
      ]
    });

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Ошибка при отправке сообщения' });
  }
};
