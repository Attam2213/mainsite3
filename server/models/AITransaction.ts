import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

class AITransaction extends Model {
  declare id: string;
  declare userId: string;
  declare provider: AIProvider;
  declare action: 'generate-website' | string;
  declare inputTokens: number;
  declare outputTokens: number;
  declare ourCostRUB: number;
  declare userBilledRUB: number;
  declare profitRUB: number;
  declare usedOwnKey: boolean;
  declare websiteId: string | null;
  declare createdAt: Date;
}

AITransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    provider: {
      type: DataTypes.ENUM('openai', 'anthropic', 'gemini'),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'generate-website',
    },
    inputTokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    outputTokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ourCostRUB: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0,
    },
    userBilledRUB: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0,
    },
    profitRUB: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0,
    },
    usedOwnKey: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    websiteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AITransaction',
    tableName: 'ai_transactions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['createdAt'] },
      { fields: ['provider'] },
    ],
  }
);

export default AITransaction;
