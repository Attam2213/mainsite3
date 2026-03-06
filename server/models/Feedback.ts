import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Feedback extends Model {
  public id!: string;
  public email!: string;
  public telegram?: string;
  public message!: string;
  public status!: string; // new, read, contacted
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Feedback.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telegram: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('new', 'read', 'contacted'),
      defaultValue: 'new',
    },
  },
  {
    sequelize,
    modelName: 'Feedback',
    tableName: 'feedbacks',
  }
);

export default Feedback;
