import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type WalletTxType = 'deposit' | 'withdraw' | 'adjust' | 'refund';

class WalletTransaction extends Model {
  declare id: string;
  declare userId: string;
  declare amount: number;
  declare type: WalletTxType;
  declare description: string | null;
  declare invoiceId: string | null;
  declare gameServerId: string | null;
  declare relatedId: string | null;
  declare metadata: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WalletTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isNumeric: true,
      },
    },
    type: {
      type: DataTypes.ENUM('deposit', 'withdraw', 'adjust', 'refund'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'invoices', key: 'id' },
    },
    gameServerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'game_servers', key: 'id' },
    },
    relatedId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'WalletTransaction',
    tableName: 'wallet_transactions',
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['createdAt'] },
      { fields: ['invoiceId'] },
      { fields: ['gameServerId'] },
    ],
  }
);

export default WalletTransaction;
