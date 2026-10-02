import User from './User';
import Service from './Service';
import PortfolioItem from './PortfolioItem';
import Project from './Project';
import Invoice from './Invoice';
import Order from './Order';
import Message from './Message';
import Server from './Server';
import Site from './Site';
import Lead from './Lead';
import Feedback from './Feedback';
import ServerNode from './ServerNode';
import GameServer from './GameServer';
import WebSite from './WebSite';
import WebSiteBackup from './WebSiteBackup';
import WalletTransaction from './WalletTransaction';
import AITransaction from './AITransaction';

// Associations
User.hasMany(Project, { foreignKey: 'clientId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Service.hasMany(Invoice, { foreignKey: 'serviceId', as: 'invoices' });
Invoice.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

Project.hasMany(Invoice, { foreignKey: 'projectId', as: 'invoices' });
Invoice.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Order Associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Service.hasMany(Order, { foreignKey: 'serviceId', as: 'orders' });
Order.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// Message Associations
Order.hasMany(Message, { foreignKey: 'orderId', as: 'messages' });
Message.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Site Associations (old Studio — hidden, preserved)
User.hasMany(Site, { foreignKey: 'userId', as: 'sites' });
Site.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Server.hasMany(Site, { foreignKey: 'serverId', as: 'sites' });
Site.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });

Site.hasMany(Lead, { foreignKey: 'siteId', as: 'leads' });
Lead.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

// GameServers Associations
GameServer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
GameServer.belongsTo(ServerNode, { foreignKey: 'nodeId', as: 'node' });

GameServer.hasMany(Invoice, { foreignKey: 'gameServerId', as: 'invoices' });
Invoice.belongsTo(GameServer, { foreignKey: 'gameServerId', as: 'gameServer' });

// WebSite (new Hosting feature) Associations
User.hasMany(WebSite, { foreignKey: 'userId', as: 'webSites' });
WebSite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ServerNode.hasMany(WebSite, { foreignKey: 'nodeId', as: 'webSites' });
WebSite.belongsTo(ServerNode, { foreignKey: 'nodeId', as: 'node' });

WebSite.hasMany(Invoice, { foreignKey: 'siteId', as: 'invoices' });
Invoice.belongsTo(WebSite, { foreignKey: 'siteId', as: 'webSite' });

WebSite.hasMany(WebSiteBackup, { foreignKey: 'webSiteId', as: 'backups', onDelete: 'CASCADE' });
WebSiteBackup.belongsTo(WebSite, { foreignKey: 'webSiteId', as: 'webSite' });

User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'walletTransactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AI Transactions
User.hasMany(AITransaction, { foreignKey: 'userId', as: 'aiTransactions' });
AITransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AITransaction.belongsTo(WebSite, { foreignKey: 'websiteId', as: 'webSite', constraints: false });

export {
  User,
  Service,
  PortfolioItem,
  Project,
  Invoice,
  Order,
  Message,
  Server,
  Site,
  Lead,
  Feedback,
  ServerNode,
  GameServer,
  WebSite,
  WebSiteBackup,
  WalletTransaction,
  AITransaction,
};
