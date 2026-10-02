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
import webSiteRoutes from './routes/webSiteRoutes';
import walletRoutes from './routes/walletRoutes';
import aiRoutes from './routes/aiRoutes';

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
app.use('/api/sites', webSiteRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/game-servers', gameServerRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);

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
    
    const ensureSqliteColumn = async (tableName: string, columnName: string, columnDefSql: string) => {
      const [rows] = await sequelize.query(`PRAGMA table_info(${tableName});`);
      const columns = Array.isArray(rows) ? rows.map((r: any) => r?.name).filter(Boolean) : [];
      if (!columns.includes(columnName)) {
        await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefSql};`);
      }
    };

    const dialect = sequelize.getDialect();

    try {
      if (dialect === 'sqlite') {
        await ensureSqliteColumn('services', 'hidden', 'BOOLEAN NOT NULL DEFAULT 0');
      } else if (dialect === 'postgres') {
        await sequelize.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;");
      } else {
        await sequelize.query("ALTER TABLE services ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false;");
      }
    } catch (e) {
      console.error('[DB] ensure services.hidden failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS \"supportedGames\" JSONB NOT NULL DEFAULT '[\"minecraft\",\"cs2\",\"cs16\"]'::jsonb;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS \"slotPrice\" INTEGER NOT NULL DEFAULT 10;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS \"slotPrices\" JSONB NOT NULL DEFAULT '{\"minecraft\":10,\"cs2\":10,\"cs16\":10}'::jsonb;");
      } else if (dialect === 'sqlite') {
        await ensureSqliteColumn('server_nodes', 'supportedGames', "TEXT DEFAULT '[\"minecraft\",\"cs2\",\"cs16\"]'");
        await ensureSqliteColumn('server_nodes', 'slotPrice', 'INTEGER DEFAULT 10');
        await ensureSqliteColumn('server_nodes', 'slotPrices', "TEXT DEFAULT '{\"minecraft\":10,\"cs2\":10,\"cs16\":10}'");
      } else {
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN supportedGames TEXT DEFAULT '[\"minecraft\",\"cs2\",\"cs16\"]';");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN slotPrice INTEGER DEFAULT 10;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN slotPrices TEXT DEFAULT '{\"minecraft\":10,\"cs2\":10,\"cs16\":10}';");
      }
    } catch (e) {
      console.error('[DB] ensure server_nodes columns failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS \"paidUntil\" TIMESTAMP WITH TIME ZONE;");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS \"monthlyPrice\" INTEGER DEFAULT 0;");
        await sequelize.query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"gameServerId\" UUID;");
        await sequelize.query("UPDATE game_servers SET \"paidUntil\" = NOW() + INTERVAL '30 days' WHERE \"paidUntil\" IS NULL;");
      } else if (dialect === 'sqlite') {
        await ensureSqliteColumn('game_servers', 'paidUntil', 'DATETIME');
        await ensureSqliteColumn('game_servers', 'monthlyPrice', 'INTEGER DEFAULT 0');
        await ensureSqliteColumn('invoices', 'gameServerId', 'UUID');
        await sequelize.query("UPDATE game_servers SET paidUntil = datetime('now', '+30 days') WHERE paidUntil IS NULL;");
      } else {
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN paidUntil DATETIME;");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN monthlyPrice INTEGER DEFAULT 0;");
        await sequelize.query("ALTER TABLE invoices ADD COLUMN gameServerId UUID;");
        await sequelize.query("UPDATE game_servers SET paidUntil = datetime('now', '+30 days') WHERE paidUntil IS NULL;");
      }
    } catch (e) {
      console.error('[DB] ensure game_servers/invoices columns failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS mcVersion VARCHAR(64) NOT NULL DEFAULT 'LATEST';");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS mcCustomJarUrl TEXT;");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS mcCustomJarName VARCHAR(255);");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS cs16Build VARCHAR(64) NOT NULL DEFAULT 'jives_cstrike_latest';");
      } else if (dialect === 'sqlite') {
        await ensureSqliteColumn('game_servers', 'mcVersion', 'VARCHAR(64) DEFAULT \'LATEST\'');
        await ensureSqliteColumn('game_servers', 'mcCustomJarUrl', 'TEXT');
        await ensureSqliteColumn('game_servers', 'mcCustomJarName', 'VARCHAR(255)');
        await ensureSqliteColumn('game_servers', 'cs16Build', 'VARCHAR(64) DEFAULT \'jives_cstrike_latest\'');
      } else {
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN mcVersion VARCHAR(64) DEFAULT 'LATEST';");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN mcCustomJarUrl TEXT;");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN mcCustomJarName VARCHAR(255);");
        await sequelize.query("ALTER TABLE game_servers ADD COLUMN cs16Build VARCHAR(64) DEFAULT 'jives_cstrike_latest';");
      }
    } catch (e) {
      console.error('[DB] ensure game_servers mcVersion/mcCustom*/cs16Build columns failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        await sequelize.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) NOT NULL DEFAULT 0.0;");
      } else if (dialect === 'sqlite') {
        await ensureSqliteColumn('users', 'balance', 'DECIMAL(12,2) DEFAULT 0.0');
      } else {
        await sequelize.query("ALTER TABLE users ADD COLUMN balance DECIMAL(12,2) DEFAULT 0.0;");
      }
    } catch (e) {
      console.error('[DB] ensure users.balance column failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS type VARCHAR(16) NOT NULL DEFAULT 'game';");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS capacityWebSites INTEGER NOT NULL DEFAULT 50;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS usedWebSites INTEGER NOT NULL DEFAULT 0;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS webSftpPortStart INTEGER NOT NULL DEFAULT 2222;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN IF NOT EXISTS webSftpPortEnd INTEGER NOT NULL DEFAULT 2299;");
        await sequelize.query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS siteId UUID;");
      } else if (dialect === 'sqlite') {
        await ensureSqliteColumn('server_nodes', 'type', 'VARCHAR(16) DEFAULT \'game\'');
        await ensureSqliteColumn('server_nodes', 'capacityWebSites', 'INTEGER DEFAULT 50');
        await ensureSqliteColumn('server_nodes', 'usedWebSites', 'INTEGER DEFAULT 0');
        await ensureSqliteColumn('server_nodes', 'webSftpPortStart', 'INTEGER DEFAULT 2222');
        await ensureSqliteColumn('server_nodes', 'webSftpPortEnd', 'INTEGER DEFAULT 2299');
        await ensureSqliteColumn('invoices', 'siteId', 'UUID');
      } else {
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN type VARCHAR(16) DEFAULT 'game';");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN capacityWebSites INTEGER DEFAULT 50;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN usedWebSites INTEGER DEFAULT 0;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN webSftpPortStart INTEGER DEFAULT 2222;");
        await sequelize.query("ALTER TABLE server_nodes ADD COLUMN webSftpPortEnd INTEGER DEFAULT 2299;");
        await sequelize.query("ALTER TABLE invoices ADD COLUMN siteId UUID;");
      }
    } catch (e) {
      console.error('[DB] ensure server_nodes.type/capacityWeb + invoices.siteId columns failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS web_sites (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" UUID NOT NULL,
          "nodeId" UUID,
          domain VARCHAR(255) UNIQUE,
          "domainType" VARCHAR(16) DEFAULT 'custom',
          "subdomainName" VARCHAR(64) UNIQUE,
          plan VARCHAR(16) NOT NULL DEFAULT 'landing',
          "priceMonthly" INTEGER NOT NULL DEFAULT 399,
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          "paidUntil" DATE,
          "pm2ProcessName" VARCHAR(128),
          "sftpUsername" VARCHAR(64) UNIQUE,
          "sftpPasswordHash" VARCHAR(255),
          "sftpPasswordPlainOnce" VARCHAR(128),
          "sftpPort" INTEGER DEFAULT 22,
          "sftpChroot" VARCHAR(255),
          "nginxConfPath" VARCHAR(255),
          "sslCertPath" VARCHAR(255),
          "sslExpiresAt" DATE,
          settings JSONB DEFAULT '{}'::jsonb,
          "gitRepoUrl" VARCHAR(512),
          "backupEnabled" BOOLEAN NOT NULL DEFAULT true,
          "coreTemplate" VARCHAR(16) NOT NULL DEFAULT 'static',
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`);
        await sequelize.query(`CREATE TABLE IF NOT EXISTS web_site_backups (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "webSiteId" UUID NOT NULL REFERENCES web_sites(id) ON DELETE CASCADE,
          "fileName" VARCHAR(255) NOT NULL,
          "filePath" VARCHAR(512) NOT NULL,
          "sizeBytes" BIGINT NOT NULL DEFAULT 0,
          note VARCHAR(255),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_user ON web_sites("userId");`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_node ON web_sites("nodeId");`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_status ON web_sites(status);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_domain_type ON web_sites("domainType");`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_site_backups_site ON web_site_backups("webSiteId");`);
      } else if (dialect === 'sqlite') {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS web_sites (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          "userId" TEXT NOT NULL,
          "nodeId" TEXT,
          domain TEXT UNIQUE,
          "domainType" TEXT DEFAULT 'custom',
          "subdomainName" TEXT UNIQUE,
          plan TEXT NOT NULL DEFAULT 'landing',
          "priceMonthly" INTEGER NOT NULL DEFAULT 399,
          status TEXT NOT NULL DEFAULT 'pending',
          "paidUntil" TEXT,
          "pm2ProcessName" TEXT,
          "sftpUsername" TEXT UNIQUE,
          "sftpPasswordHash" TEXT,
          "sftpPasswordPlainOnce" TEXT,
          "sftpPort" INTEGER DEFAULT 22,
          "sftpChroot" TEXT,
          "nginxConfPath" TEXT,
          "sslCertPath" TEXT,
          "sslExpiresAt" TEXT,
          settings TEXT DEFAULT '{}',
          "gitRepoUrl" TEXT,
          "backupEnabled" INTEGER NOT NULL DEFAULT 1,
          "coreTemplate" TEXT NOT NULL DEFAULT 'static',
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
        );`);
        await sequelize.query(`CREATE TABLE IF NOT EXISTS web_site_backups (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          "webSiteId" TEXT NOT NULL REFERENCES web_sites(id) ON DELETE CASCADE,
          "fileName" TEXT NOT NULL,
          "filePath" TEXT NOT NULL,
          "sizeBytes" INTEGER NOT NULL DEFAULT 0,
          note TEXT,
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
        );`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_user ON web_sites("userId");`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_node ON web_sites("nodeId");`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_status ON web_sites(status);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_sites_domain_type ON web_sites("domainType");`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_web_site_backups_site ON web_site_backups("webSiteId");`);
      } else {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS web_sites (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          nodeId VARCHAR(36),
          domain VARCHAR(255) UNIQUE,
          domainType VARCHAR(16) DEFAULT 'custom',
          subdomainName VARCHAR(64) UNIQUE,
          plan VARCHAR(16) NOT NULL DEFAULT 'landing',
          priceMonthly INTEGER NOT NULL DEFAULT 399,
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          paidUntil DATE,
          pm2ProcessName VARCHAR(128),
          sftpUsername VARCHAR(64) UNIQUE,
          sftpPasswordHash VARCHAR(255),
          sftpPasswordPlainOnce VARCHAR(128),
          sftpPort INTEGER DEFAULT 22,
          sftpChroot VARCHAR(255),
          nginxConfPath VARCHAR(255),
          sslCertPath VARCHAR(255),
          sslExpiresAt DATE,
          settings JSON DEFAULT '{}',
          gitRepoUrl VARCHAR(512),
          backupEnabled BOOLEAN NOT NULL DEFAULT true,
          coreTemplate VARCHAR(16) NOT NULL DEFAULT 'static',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        await sequelize.query(`CREATE TABLE IF NOT EXISTS web_site_backups (
          id VARCHAR(36) PRIMARY KEY,
          webSiteId VARCHAR(36) NOT NULL REFERENCES web_sites(id) ON DELETE CASCADE,
          fileName VARCHAR(255) NOT NULL,
          filePath VARCHAR(512) NOT NULL,
          sizeBytes BIGINT NOT NULL DEFAULT 0,
          note VARCHAR(255),
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_web_site_backups_site (webSiteId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      }
    } catch (e) {
      console.error('[DB] ensure web_sites + web_site_backups tables failed:', e);
    }

    try {
      if (dialect === 'postgres') {
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "domainType" VARCHAR(16) DEFAULT 'custom';`); } catch (_) {}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "subdomainName" VARCHAR(64) UNIQUE;`); } catch (_) {}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "sftpPassword" VARCHAR(128);`); } catch (_) {}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "sshUsername" VARCHAR(128);`); } catch (_) {}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "sshPassword" VARCHAR(128);`); } catch (_) {}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "sshPasswordHash" VARCHAR(256);`); } catch (_) {}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN IF NOT EXISTS "sshPort" INTEGER DEFAULT 22;`); } catch (_) {}
      } else if (dialect === 'sqlite') {
        try { await ensureSqliteColumn('web_sites','domainType',"TEXT DEFAULT 'custom'"); } catch(_){}
        try { await ensureSqliteColumn('web_sites','subdomainName','TEXT UNIQUE'); } catch(_){}
        try { await ensureSqliteColumn('web_sites','sftpPassword','TEXT'); } catch(_){}
        try { await ensureSqliteColumn('web_sites','sshUsername','TEXT UNIQUE'); } catch(_){}
        try { await ensureSqliteColumn('web_sites','sshPassword','TEXT'); } catch(_){}
        try { await ensureSqliteColumn('web_sites','sshPasswordHash','TEXT'); } catch(_){}
        try { await ensureSqliteColumn('web_sites','sshPort','INTEGER DEFAULT 22'); } catch(_){}
      } else {
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN domainType VARCHAR(16) DEFAULT 'custom';`); } catch(_){}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN subdomainName VARCHAR(64) UNIQUE;`); } catch(_){}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN sftpPassword VARCHAR(128);`); } catch(_){}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN sshUsername VARCHAR(128) UNIQUE;`); } catch(_){}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN sshPassword VARCHAR(128);`); } catch(_){}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN sshPasswordHash VARCHAR(256);`); } catch(_){}
        try { await sequelize.query(`ALTER TABLE web_sites ADD COLUMN sshPort INTEGER DEFAULT 22;`); } catch(_){}
      }
    } catch (e) {
      console.error('[DB] ensure web_sites extra columns failed:', e);
    }

    await sequelize.sync({ alter: sequelize.getDialect() === 'postgres' });
    
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
