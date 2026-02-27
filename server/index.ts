import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Load environment variables before other imports that might use them
dotenv.config();

import sequelize from './config/database';
import { User, Service, PortfolioItem, Project, Invoice, Order, Message } from './models';
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import orderRoutes from './routes/orderRoutes';
import messageRoutes from './routes/messageRoutes';
import { startMonitoring } from './services/monitorService';

// Prevent unused variable errors for now (will use them in routes later)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _models = { User, Service, PortfolioItem, Project, Invoice, Order, Message };

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/:orderId/messages', messageRoutes);

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

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
