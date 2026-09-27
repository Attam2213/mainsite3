import sequelize from '../config/database';
import { WalletTxType } from '../models/WalletTransaction';
import User from '../models/User';
import WalletTransaction from '../models/WalletTransaction';
import { Op } from 'sequelize';

export const MIN_DEPOSIT = 100;

export const round2 = (n: number | string): number => {
  const x = Number(n) || 0;
  return Math.round(x * 100) / 100;
};

export interface AdjustBalanceInput {
  userId: string;
  amount: number;
  type: WalletTxType;
  description?: string | null;
  invoiceId?: string | null;
  gameServerId?: string | null;
  relatedId?: string | null;
  metadata?: any;
}

export const getBalance = async (userId: string): Promise<number> => {
  const user = await User.findByPk(userId, { attributes: ['id', 'balance'] });
  if (!user) throw new Error('User not found');
  return round2(user.balance ?? 0);
};

export const adjustBalance = async (input: AdjustBalanceInput): Promise<{ transaction: WalletTransaction; newBalance: number }> => {
  const amount = round2(input.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error('Сумма не может быть нулевой');
  }

  const result = await sequelize.transaction(async (t) => {
    const user = await User.findByPk(input.userId, {
      attributes: ['id', 'balance'],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!user) throw new Error('User not found');

    const current = round2(user.balance ?? 0);
    const next = round2(current + amount);

    if (next < -0.0001) {
      throw new Error(`Недостаточно средств: нужно ${Math.abs(amount).toFixed(2)} ₽, на балансе ${current.toFixed(2)} ₽`);
    }

    const [affectedRows] = await User.update(
      { balance: next },
      {
        where: {
          id: input.userId,
          balance: { [Op.between]: [round2(current - 0.01), round2(current + 0.01)] } as any,
        },
        transaction: t,
      }
    );
    if (affectedRows !== 1) {
      throw new Error('Race condition при изменении баланса, повторите попытку');
    }

    const tx = await WalletTransaction.create(
      {
        userId: input.userId,
        amount,
        type: input.type,
        description: input.description ?? null,
        invoiceId: input.invoiceId ?? null,
        gameServerId: input.gameServerId ?? null,
        relatedId: input.relatedId ?? null,
        metadata: input.metadata ?? null,
      },
      { transaction: t }
    );

    return { transaction: tx, newBalance: next };
  });

  return result;
};

export interface ListTxFilter {
  userId?: string;
  clientId?: string;
  type?: WalletTxType;
  limit?: number;
  offset?: number;
}

export const listTransactions = async (filter: ListTxFilter) => {
  const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
  const offset = Math.max(0, Number(filter.offset) || 0);
  const where: any = {};
  if (filter.clientId) where.userId = filter.clientId;
  if (filter.userId && !filter.clientId) where.userId = filter.userId;
  if (filter.type) where.type = filter.type;

  const { count, rows } = await WalletTransaction.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });
  return { count, rows };
};
