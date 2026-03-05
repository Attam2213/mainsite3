
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Site extends Model {
  public id!: string;
  public userId!: string;
  public serverId!: string;
  public domain!: string;
  public status!: 'pending' | 'active' | 'suspended';
  public cmsVersion!: string;
  public settings!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Site.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    serverId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null initially if provisioning
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended'),
      defaultValue: 'pending',
    },
    cmsVersion: {
      type: DataTypes.STRING,
      defaultValue: '1.0.0',
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'sites',
  }
);

export default Site;
