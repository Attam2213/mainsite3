import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isPostgres = process.env.DB_DIALECT === 'postgres';

const sequelize = isPostgres
  ? new Sequelize(
      process.env.DB_NAME || 'mainsite',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false,
    });

export default sequelize;
