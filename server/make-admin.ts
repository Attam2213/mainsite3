
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from './models/User';
import sequelize from './config/database';

const email = process.argv[2];

if (!email) {
  console.error('Пожалуйста, укажите email пользователя.');
  console.error('Пример: npx tsx server/make-admin.ts user@example.com');
  process.exit(1);
}

const makeAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно.');

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`Пользователь с email ${email} не найден.`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`Пользователь ${email} уже является администратором.`);
      return;
    }

    user.role = 'admin';
    await user.save();
    
    console.log(`✅ Пользователь ${email} успешно назначен администратором!`);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
  } finally {
    await sequelize.close();
  }
};

makeAdmin();
