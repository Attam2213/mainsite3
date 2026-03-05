import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Lead extends Model {
  public id!: string;
  public siteId!: string;
  public name!: string;
  public email!: string;
  public phone?: string;
  public message!: string;
  public status!: string; // new, contacted, closed
  public createdAt!: Date;
  public updatedAt!: Date;
}

Lead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    siteId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'new',
    },
  },
  {
    sequelize,
    modelName: 'Lead',
    tableName: 'leads',
  }
);

export default Lead;
