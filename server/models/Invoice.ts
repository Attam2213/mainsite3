import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Invoice extends Model {
  public id!: string;
  public userId!: string;
  public title!: string;
  public amount!: number;
  public type!: 'one_time' | 'monthly';
  public status!: 'pending' | 'paid' | 'cancelled';
  public dueDate!: Date;
  public description?: string;
}

Invoice.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('one_time', 'monthly'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    defaultValue: 'pending',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Invoice',
});
