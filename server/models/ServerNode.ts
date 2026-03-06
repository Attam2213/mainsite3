import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ServerNode extends Model {
  public id!: string;
  public name!: string;
  public ip!: string;
  public sshPort!: number;
  public sshUser!: string;
  public sshPassword!: string; // Encrypted
  public totalRam!: number;
  public usedRam!: number;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ServerNode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    ip: { type: DataTypes.STRING, allowNull: false },
    sshPort: { type: DataTypes.INTEGER, defaultValue: 22 },
    sshUser: { type: DataTypes.STRING, defaultValue: 'root' },
    sshPassword: { type: DataTypes.STRING, allowNull: true },
    totalRam: { type: DataTypes.INTEGER, defaultValue: 0 },
    usedRam: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
  },
  {
    sequelize,
    modelName: 'ServerNode',
    tableName: 'server_nodes',
  }
);

export default ServerNode;
