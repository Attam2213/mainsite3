import sequelize from './config/database';

const run = async () => {
  try {
    console.log('Fixing DB schema...');
    
    const queries = [
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
        "CREATE TABLE IF NOT EXISTS game_servers (id UUID PRIMARY KEY, userId UUID, nodeId UUID, game VARCHAR(255), name VARCHAR(255), port INTEGER, ram INTEGER, slots INTEGER DEFAULT 10, status VARCHAR(255) DEFAULT 'installing', containerId VARCHAR(255), rconPassword VARCHAR(255), createdAt DATETIME, updatedAt DATETIME);",
        "INSERT OR IGNORE INTO server_nodes (id, name, ip, sshPort, sshUser, totalRam, status, createdAt, updatedAt) VALUES ('77777777-7777-7777-7777-777777777777', 'MSK-1 (Test)', '127.0.0.1', 22, 'root', 16384, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);",
        "INSERT OR IGNORE INTO server_nodes (id, name, ip, sshPort, sshUser, totalRam, status, createdAt, updatedAt) VALUES ('88888888-8888-8888-8888-888888888888', 'Germany-1', '1.1.1.1', 22, 'root', 32768, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
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