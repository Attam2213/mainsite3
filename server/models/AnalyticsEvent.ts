import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class AnalyticsEvent extends Model {
  declare id: string;
  declare path: string;
  declare sessionId: string;
  declare ipHash: string;
  declare userAgent?: string;
  declare referrer?: string;
  declare userId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AnalyticsEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    path: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    ipHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    referrer: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AnalyticsEvent',
    tableName: 'analytics_events',
    indexes: [
      { fields: ['createdAt'] },
      { fields: ['sessionId'] },
      { fields: ['ipHash'] },
      { fields: ['path'] },
    ],
  }
);

export default AnalyticsEvent;
