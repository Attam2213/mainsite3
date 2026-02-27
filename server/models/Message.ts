import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Message extends Model {
  declare id: string;
  declare orderId: string;
  declare senderId: string;
  declare content: string;
  declare createdAt: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
  }
);

export default Message;
