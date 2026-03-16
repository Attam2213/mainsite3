import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables before other imports that might use them
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import sequelize from './config/database';
import { User, Service, PortfolioItem, Project, Invoice, Order, Message, Server, Site } from './models';
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import userRoutes from './routes/userRoutes';
import leadRoutes from './routes/leadRoutes';
import projectRoutes from './routes/projectRoutes';
import orderRoutes from './routes/orderRoutes';
import messageRoutes from './routes/messageRoutes';
import serverRoutes from './routes/serverRoutes';
import siteRoutes from './routes/siteRoutes';
import agentRoutes from './routes/agentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import paymentRoutes from './routes/paymentRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import { startMonitoring } from './services/monitorService';
import { startSubscriptionService } from './services/subscriptionService';
import nodeRoutes from './routes/nodeRoutes';
import gameServerRoutes from './routes/gameServerRoutes';

// Prevent unused variable errors for now (will use them in routes later)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _models = { User, Service, PortfolioItem, Project, Invoice, Order, Message, Server, Site };

const app = express();
const port = process.env.PORT || 5000;

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} started`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} completed with ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/:orderId/messages', messageRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/game-servers', gameServerRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Sync models (alter: true updates tables if they exist, force: false prevents data loss)
    // In production, use migrations instead of sync({ alter: true })
    
    // Disable alter: true to avoid SQLite unique constraint errors during dev
    try {
      await sequelize.query("ALTER TABLE services ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false;");
    } catch (e) {
      void e;
    }
    try {
      if (sequelize.getDialect() === 'postgres') {
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS \"supportedGames\" JSONB NOT NULL DEFAULT '[\"minecraft\",\"cs2\",\"cs16\"]'::jsonb;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS \"slotPrice\" INTEGER NOT NULL DEFAULT 10;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS \"slotPrices\" JSONB NOT NULL DEFAULT '{\"minecraft\":10,\"cs2\":10,\"cs16\":10}'::jsonb;");
      } else {
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN supportedGames TEXT DEFAULT '[\"minecraft\",\"cs2\",\"cs16\"]';");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN slotPrice INTEGER DEFAULT 10;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN slotPrices TEXT DEFAULT '{\"minecraft\":10,\"cs2\":10,\"cs16\":10}';");
      }
    } catch (e) {
      void e;
    }
    try {
      if (sequelize.getDialect() === 'postgres') {
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS \"paidUntil\" TIMESTAMP WITH TIME ZONE;");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS \"monthlyPrice\" INTEGER DEFAULT 0;");
        await sequelize.query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"gameServerId\" UUID;");
        await sequelize.query("UPDATE game_servers SET \"paidUntil\" = NOW() + INTERVAL '30 days' WHERE \"paidUntil\" IS NULL;");
      } else {
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN paidUntil DATETIME;");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN monthlyPrice INTEGER DEFAULT 0;");
        await sequelize.query("ALTER TABLE invoices ADD COLUMN gameServerId UUID;");
        await sequelize.query("UPDATE game_servers SET paidUntil = datetime('now', '+30 days') WHERE paidUntil IS NULL;");
      }
    } catch (e) {
      void e;
    }
    await sequelize.sync({ alter: false });
    
    console.log('Database synced.');

    // Start website monitoring service
    startMonitoring();
    startSubscriptionService();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
