import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Order extends Model {
  declare id: string;
  declare userId: string;
  declare serviceId: string;
  declare status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  declare createdAt: Date;
  declare updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if it's a custom order, though for now we link to services
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
  }
);

export default Order;
