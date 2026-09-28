import sequelize from './config/database';

const run = async () => {
  try {
    console.log('Fixing DB schema...');
    
    const queries = [
        "ALTER TABLE users ADD COLUMN balance DECIMAL(12,2) DEFAULT 0.0;",
        "ALTER TABLE server_nodes ADD COLUMN type VARCHAR(16) DEFAULT 'game';",
        "ALTER TABLE server_nodes ADD COLUMN capacityWebSites INTEGER DEFAULT 50;",
        "ALTER TABLE server_nodes ADD COLUMN usedWebSites INTEGER DEFAULT 0;",
        "ALTER TABLE server_nodes ADD COLUMN webSftpPortStart INTEGER DEFAULT 2222;",
        "ALTER TABLE server_nodes ADD COLUMN webSftpPortEnd INTEGER DEFAULT 2299;",
        "ALTER TABLE invoices ADD COLUMN siteId UUID;",
        "ALTER TABLE game_servers ADD COLUMN mcVersion VARCHAR(64) DEFAULT 'LATEST';",
        "ALTER TABLE game_servers ADD COLUMN mcCustomJarUrl TEXT;",
        "ALTER TABLE game_servers ADD COLUMN mcCustomJarName VARCHAR(255);",
        "ALTER TABLE game_servers ADD COLUMN cs16Build VARCHAR(64) DEFAULT 'jives_cstrike_latest';",
        "CREATE TABLE IF NOT EXISTS web_sites (id TEXT PRIMARY KEY, userId TEXT NOT NULL, nodeId TEXT, domain TEXT UNIQUE, plan TEXT NOT NULL DEFAULT 'landing', priceMonthly INTEGER NOT NULL DEFAULT 149, status TEXT NOT NULL DEFAULT 'pending', paidUntil TEXT, pm2ProcessName TEXT, sftpUsername TEXT UNIQUE, sftpPasswordHash TEXT, sftpPasswordPlainOnce TEXT, sftpPort INTEGER DEFAULT 22, sftpChroot TEXT, nginxConfPath TEXT, sslCertPath TEXT, sslExpiresAt TEXT, settings TEXT DEFAULT '{}', gitRepoUrl TEXT, backupEnabled INTEGER NOT NULL DEFAULT 1, coreTemplate TEXT NOT NULL DEFAULT 'static', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);",
        "CREATE TABLE IF NOT EXISTS web_site_backups (id TEXT PRIMARY KEY, webSiteId TEXT NOT NULL, fileName TEXT NOT NULL, filePath TEXT NOT NULL, sizeBytes INTEGER NOT NULL DEFAULT 0, note TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);",
        "ALTER TABLE projects ADD COLUMN paidUntil DATE;",
        "ALTER TABLE projects ADD COLUMN siteStatus TEXT DEFAULT 'unknown';",
        "ALTER TABLE invoices ADD COLUMN periodMonths INTEGER DEFAULT 1;",
        "ALTER TABLE invoices ADD COLUMN projectId UUID;",
        "ALTER TABLE projects ADD COLUMN monthlyRate INTEGER DEFAULT 0;",
        "ALTER TABLE projects ADD COLUMN sshUsername TEXT;",
        "ALTER TABLE projects ADD COLUMN sshPassword TEXT;",
        "ALTER TABLE projects ADD COLUMN pm2ProcessName TEXT;",
        "ALTER TABLE game_servers ADD COLUMN slots INTEGER DEFAULT 10;",
        "ALTER TABLE game_servers ADD COLUMN core VARCHAR(255) DEFAULT 'vanilla';",
        "CREATE TABLE IF NOT EXISTS feedbacks (id UUID PRIMARY KEY, email VARCHAR(255) NOT NULL, telegram VARCHAR(255), message TEXT NOT NULL, status VARCHAR(255) DEFAULT 'new', createdAt DATETIME, updatedAt DATETIME);",
        "CREATE TABLE IF NOT EXISTS server_nodes (id UUID PRIMARY KEY, name VARCHAR(255) NOT NULL, ip VARCHAR(255) NOT NULL, sshPort INTEGER DEFAULT 22, sshUser VARCHAR(255) DEFAULT 'root', sshPassword VARCHAR(255), totalRam INTEGER DEFAULT 0, usedRam INTEGER DEFAULT 0, status VARCHAR(255) DEFAULT 'active', createdAt DATETIME, updatedAt DATETIME);",
        "CREATE TABLE IF NOT EXISTS game_servers (id UUID PRIMARY KEY, userId UUID, nodeId UUID, game VARCHAR(255), name VARCHAR(255), port INTEGER, ram INTEGER, slots INTEGER DEFAULT 10, status VARCHAR(255) DEFAULT 'installing', containerId VARCHAR(255), rconPassword VARCHAR(255), createdAt DATETIME, updatedAt DATETIME);"
    ];

    for (const q of queries) {
        try {
            await sequelize.query(q);
            console.log(`Executed: ${q}`);
        } catch (e: any) {
            console.log(`Skipped (probably exists): ${q} - ${e.message}`);
        }
    }
    
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();