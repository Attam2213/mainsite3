import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Attachment extends Model {
  public id!: string;
  public projectId!: string;
  public name!: string;
  public url!: string;
  public type!: 'file' | 'image' | 'link';
}

Attachment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'id',
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('file', 'image', 'link'),
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Attachment',
});
