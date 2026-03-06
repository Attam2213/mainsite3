import sequelize from './config/database';

const run = async () => {
  try {
    console.log('Fixing DB schema...');
    
    const queries = [
        "ALTER TABLE projects ADD COLUMN paidUntil DATE;",
        "ALTER TABLE projects ADD COLUMN siteStatus TEXT DEFAULT 'unknown';",
        "ALTER TABLE invoices ADD COLUMN periodMonths INTEGER DEFAULT 1;",
        "ALTER TABLE invoices ADD COLUMN projectId UUID;",
        "ALTER TABLE projects ADD COLUMN monthlyRate INTEGER DEFAULT 0;"
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