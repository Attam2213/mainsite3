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

// Associations
User.hasMany(Project, { foreignKey: 'clientId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Service.hasMany(Invoice, { foreignKey: 'serviceId', as: 'invoices' });
Invoice.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

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

// Site Associations
User.hasMany(Site, { foreignKey: 'userId', as: 'sites' });
Site.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Server.hasMany(Site, { foreignKey: 'serverId', as: 'sites' });
Site.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });

Site.hasMany(Lead, { foreignKey: 'siteId', as: 'leads' });
Lead.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

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
  Feedback
};
