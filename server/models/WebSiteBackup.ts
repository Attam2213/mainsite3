import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class WebSiteBackup extends Model {
  declare id: string;
  declare webSiteId: string;
  declare fileName: string;
  declare filePath: string;
  declare sizeBytes: number;
  declare note: string | null;
  declare readonly createdAt: Date;
}

WebSiteBackup.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    webSiteId: { type: DataTypes.UUID, allowNull: false },
    fileName: { type: DataTypes.STRING, allowNull: false },
    filePath: { type: DataTypes.STRING, allowNull: false },
    sizeBytes: { type: DataTypes.BIGINT, defaultValue: 0 },
    note: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'WebSiteBackup',
    tableName: 'web_site_backups',
    indexes: [{ fields: ['webSiteId'], using: 'BTREE' }],
  }
);

export default WebSiteBackup;
