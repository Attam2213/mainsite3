import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Invoice extends Model {
  declare id: string;
  declare title: string;
  declare amount: number;
  declare status: 'pending' | 'paid' | 'cancelled';
  declare type: 'one_time' | 'monthly';
  declare dueDate: string;
  declare userId: string;
  declare serviceId: string | null;
  declare projectId: string | null;
  declare periodMonths: number;
}

Invoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      defaultValue: 'pending',
    },
    type: {
      type: DataTypes.ENUM('one_time', 'monthly'),
      defaultValue: 'one_time',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    periodMonths: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
  }
);

export default Invoice;
