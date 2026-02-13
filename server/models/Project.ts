import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Project extends Model {
  public id!: string;
  public clientId!: string;
  public name!: string;
  public status!: 'pending' | 'in_progress' | 'completed';
  public progress!: number;
  public deadline!: Date;
  public cost!: string;
  public description?: string;
}

Project.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  cost: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Project',
});
