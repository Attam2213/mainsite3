import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Service extends Model {
  public id!: string;
  public title!: string;
  public description!: string;
  public price!: string;
  public iconName!: string;
}

Service.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  iconName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Monitor',
  },
}, {
  sequelize,
  modelName: 'Service',
});
