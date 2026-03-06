import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Project extends Model {
  declare id: string;
  declare title: string;
  declare status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  declare budget: number;
  declare deadline: Date;
  declare progress: number;
  declare clientId: string;
  declare serverIp: string;
  declare monthlyRate: number;
  declare websiteUrl: string;
  declare sshUsername?: string;
  declare sshPassword?: string;
  declare pm2ProcessName?: string;
  declare siteStatus: 'up' | 'down' | 'unknown';
  declare lastChecked: Date;
  declare paidUntil: Date;
}

Project.init(
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
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    budget: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    monthlyRate: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    serverIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    websiteUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sshUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sshPassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pm2ProcessName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    siteStatus: {
      type: DataTypes.ENUM('up', 'down', 'unknown'),
      defaultValue: 'unknown',
    },
    lastChecked: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
  }
);

export default Project;
