import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class GameServer extends Model {
  declare id: string;
  declare userId: string;
  declare nodeId: string;
  declare game: string;
  declare name: string;
  declare port: number;
  declare ram: number;
  declare slots: number;
  declare core: string;
  declare status: string;
  declare monthlyPrice: number;
  declare paidUntil: Date | null;
  declare containerId?: string;
  declare rconPassword?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GameServer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    nodeId: { type: DataTypes.UUID, allowNull: false },
    game: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    port: { type: DataTypes.INTEGER, allowNull: true },
    ram: { type: DataTypes.INTEGER, defaultValue: 1024 },
    slots: { type: DataTypes.INTEGER, defaultValue: 10 },
    core: { type: DataTypes.STRING, defaultValue: 'vanilla' },
    status: { type: DataTypes.STRING, defaultValue: 'installing' },
    monthlyPrice: { type: DataTypes.INTEGER, defaultValue: 0 },
    paidUntil: { type: DataTypes.DATE, allowNull: true },
    containerId: { type: DataTypes.STRING, allowNull: true },
    rconPassword: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'GameServer',
    tableName: 'game_servers',
  }
);

export default GameServer;
