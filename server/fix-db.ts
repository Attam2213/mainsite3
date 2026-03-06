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
        "CREATE TABLE IF NOT EXISTS feedbacks (id UUID PRIMARY KEY, email VARCHAR(255) NOT NULL, telegram VARCHAR(255), message TEXT NOT NULL, status VARCHAR(255) DEFAULT 'new', createdAt DATETIME, updatedAt DATETIME);"
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