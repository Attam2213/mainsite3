import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Используем абсолютный путь для надежности на сервере
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite');

console.log('Database path:', dbPath);

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Отключаем логирование SQL запросов для чистоты консоли
});

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
