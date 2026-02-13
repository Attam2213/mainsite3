import { User } from './User.js';
import { Service } from './Service.js';
import { Project } from './Project.js';
import { Invoice } from './Invoice.js';
import { Comment } from './Comment.js';
import { Attachment } from './Attachment.js';
import { Setting } from './Setting.js';
import { Ticket } from './Ticket.js';
import { Message } from './Message.js';
import { PortfolioItem } from './PortfolioItem.js';

// Define associations
User.hasMany(Project, { foreignKey: 'clientId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Comment, { foreignKey: 'projectId', as: 'comments' });
Comment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Project.hasMany(Attachment, { foreignKey: 'projectId', as: 'attachments' });
Attachment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Ticket.hasMany(Message, { foreignKey: 'ticketId', as: 'messages' });
Message.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

export {
  User,
  Service,
  Project,
  Invoice,
  Comment,
  Attachment,
  Setting,
  Ticket,
  Message,
  PortfolioItem
};
