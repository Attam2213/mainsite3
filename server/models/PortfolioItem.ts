import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class PortfolioItem extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare imageUrl: string;
  declare link: string;
  declare github: string;
  declare category: string;
  declare tags: string[];
}

PortfolioItem.init(
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
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    github: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'landing',
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'PortfolioItem',
    tableName: 'portfolio_items',
  }
);

export default PortfolioItem;
