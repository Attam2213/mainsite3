import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class GameServer extends Model {
  public id!: string;
  public userId!: string;
  public nodeId!: string;
  public game!: string; // minecraft, cs2
  public name!: string;
  public port!: number;
  public ram!: number;
  public status!: string; // installing, running, stopped, error
  public containerId?: string;
  public rconPassword?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    status: { type: DataTypes.STRING, defaultValue: 'installing' },
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
