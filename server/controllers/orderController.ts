import { Request, Response } from 'express';
import { Order, User, Service, Message } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { serviceId } = req.body;

    const order = await Order.create({
      userId,
      serviceId,
      status: 'pending'
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const user = req.user;
    
    let whereClause = {};
    if (user && user.role !== 'admin') {
      whereClause = { userId: user.id };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Service, as: 'service', attributes: ['id', 'title', 'price'] }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "messages" AS "message"
              WHERE
                "message"."orderId" = "Order"."id"
                AND "message"."senderId" != '${user.id}'
                AND ("message"."isRead" = 0 OR "message"."isRead" IS NULL)
            )`),
            'unreadCount'
          ]
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
};

export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id as string);
    if (!order) {
      res.status(404).json({ message: 'Заказ не найден' });
      return;
    }

    await order.update({ status });
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении заказа' });
  }
};
