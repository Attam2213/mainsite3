import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

type WebSitePlan = 'landing' | 'business' | 'premium';
type WebSiteStatus = 'pending' | 'provisioning' | 'active' | 'suspended' | 'deleting' | 'deleted';
type WebSiteTemplate = 'static' | 'nodejs' | 'wordpress';
type WebSiteDomainType = 'subdomain' | 'custom';

class WebSite extends Model {
  declare id: string;
  declare userId: string;
  declare nodeId: string | null;
  declare domain: string | null;
  declare domainType: WebSiteDomainType | null;
  declare subdomainName: string | null;
  declare plan: WebSitePlan;
  declare priceMonthly: number;
  declare status: WebSiteStatus;
  declare paidUntil: string | null;
  declare pm2ProcessName: string | null;
  declare sftpUsername: string | null;
  declare sftpPasswordHash: string | null;
  declare sftpPasswordPlainOnce: string | null;
  declare sftpPassword: string | null;
  declare sftpPort: number | null;
  declare sftpChroot: string | null;
  declare sshUsername: string | null;
  declare sshPassword: string | null;
  declare sshPasswordHash: string | null;
  declare sshPort: number | null;
  declare nginxConfPath: string | null;
  declare sslCertPath: string | null;
  declare sslExpiresAt: string | null;
  declare settings: any;
  declare gitRepoUrl: string | null;
  declare backupEnabled: boolean;
  declare coreTemplate: WebSiteTemplate;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WebSite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    nodeId: { type: DataTypes.UUID, allowNull: true },
    domain: { type: DataTypes.STRING, allowNull: true, unique: true },
    domainType: {
      type: DataTypes.ENUM('subdomain', 'custom'),
      allowNull: true,
      defaultValue: 'custom',
    },
    subdomainName: { type: DataTypes.STRING, allowNull: true, unique: true },
    plan: {
      type: DataTypes.ENUM('landing', 'business', 'premium'),
      allowNull: false,
      defaultValue: 'landing',
    },
    priceMonthly: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 149 },
    status: {
      type: DataTypes.ENUM('pending', 'provisioning', 'active', 'suspended', 'deleting', 'deleted'),
      defaultValue: 'pending',
    },
    paidUntil: { type: DataTypes.DATEONLY, allowNull: true },
    pm2ProcessName: { type: DataTypes.STRING, allowNull: true },
    sftpUsername: { type: DataTypes.STRING, allowNull: true, unique: true },
    sftpPasswordHash: { type: DataTypes.STRING, allowNull: true },
    sftpPasswordPlainOnce: { type: DataTypes.STRING, allowNull: true },
    sftpPassword: { type: DataTypes.STRING, allowNull: true },
    sftpPort: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 22 },
    sftpChroot: { type: DataTypes.STRING, allowNull: true },
    sshUsername: { type: DataTypes.STRING, allowNull: true },
    sshPassword: { type: DataTypes.STRING(128), allowNull: true },
    sshPasswordHash: { type: DataTypes.STRING, allowNull: true },
    sshPort: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 22 },
    nginxConfPath: { type: DataTypes.STRING, allowNull: true },
    sslCertPath: { type: DataTypes.STRING, allowNull: true },
    sslExpiresAt: { type: DataTypes.DATEONLY, allowNull: true },
    settings: { type: DataTypes.JSON, defaultValue: {} },
    gitRepoUrl: { type: DataTypes.STRING, allowNull: true },
    backupEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    coreTemplate: {
      type: DataTypes.ENUM('static', 'nodejs', 'wordpress'),
      defaultValue: 'static',
    },
  },
  {
    sequelize,
    modelName: 'WebSite',
    tableName: 'web_sites',
    indexes: [
      { fields: ['userId'] },
      { fields: ['nodeId'] },
      { fields: ['status'] },
      { fields: ['domain'], unique: true },
      { fields: ['subdomainName'], unique: true },
      { fields: ['domainType'] },
    ],
  }
);

export default WebSite;
