import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ServerNode extends Model {
  declare id: string;
  declare name: string;
  declare ip: string;
  declare sshPort: number;
  declare sshUser: string;
  declare sshPassword: string | null; // Encrypted
  declare totalRam: number;
  declare usedRam: number;
  declare status: string;
  declare supportedGames: string[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
    supportedGames: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['minecraft', 'cs2', 'cs16'],
    },
  },
  {
    sequelize,
    modelName: 'ServerNode',
    tableName: 'server_nodes',
  }
);

export default ServerNode;
