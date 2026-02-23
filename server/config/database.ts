import { Sequelize } from 'sequelize';

const url =
  process.env.POSTGRES_URL ||
  `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}` +
  `@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'mainsite3'}`;

const useSSL = String(process.env.POSTGRES_SSL || '').toLowerCase() === 'true';

export const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSSL
    ? {
        ssl: { require: true, rejectUnauthorized: false },
      }
    : {},
});
console.log('Using PostgreSQL database');

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
