import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class PortfolioItem extends Model {
  public id!: string;
  public title!: string;
  public category!: string;
  public image!: string;
  public description!: string;
  public projectUrl?: string;
}

PortfolioItem.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  projectUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'PortfolioItem',
});
