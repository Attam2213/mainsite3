import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Server extends Model {
  public id!: string;
  public name!: string;
  public ipAddress!: string;
  public status!: 'active' | 'inactive' | 'provisioning';
  public token!: string;
  public capacity!: number;
  public currentLoad!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Server.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true, // Initially might be unknown until provisioned
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'provisioning'),
      defaultValue: 'provisioning',
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 10, // Default 10 sites per server
    },
    currentLoad: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'servers',
  }
);

export default Server;