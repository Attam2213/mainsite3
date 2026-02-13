import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Ticket extends Model {
  public id!: string;
  public userId!: string;
  public subject!: string;
  public status!: 'open' | 'closed';
  public lastMessageAt!: Date;
}

Ticket.init({
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'Ticket',
});
