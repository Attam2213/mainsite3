import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Service extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare price: string;
  declare features: string[];
  declare icon: string;
  declare color: string;
  declare hidden: boolean;
}

Service.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: 'bg-indigo-500',
    },
    hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Service',
    tableName: 'services',
  }
);

export default Service;
