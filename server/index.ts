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
