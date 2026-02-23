import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIALECT = (process.env.DB_DIALECT || '').toLowerCase();
const isPostgres = DIALECT === 'postgres' || !!process.env.POSTGRES_URL;

let sequelize: Sequelize;

if (isPostgres) {
  const url =
    process.env.POSTGRES_URL ||
    `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}` +
    `@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'mainsite3'}`;

  const useSSL = String(process.env.POSTGRES_SSL || '').toLowerCase() === 'true';
  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: useSSL
      ? {
          ssl: { require: true, rejectUnauthorized: false },
        }
      : {},
  });
  console.log('Using Postgres database via:', process.env.POSTGRES_URL ? 'POSTGRES_URL' : 'env vars');
} else {
  // Используем абсолютный путь для надежности на сервере
  const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite');
  console.log('Database path:', dbPath);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });
}

export { sequelize };

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    // Sync all models (force: false чтобы не удалять данные)
    await sequelize.sync({ force: false }); 
    console.log('Database synced');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
