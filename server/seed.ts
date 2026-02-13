import bcrypt from 'bcryptjs';
import { User, Service, Setting } from './models/index.js';

export const seedDatabase = async () => {
  try {
    // Check if admin exists
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await User.create({
        name: 'Администратор',
        email: 'admin@wexa.dev',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created');
    }

    // Check if services exist
    const serviceCount = await Service.count();
    if (serviceCount === 0) {
      const defaultServices = [
        {
          iconName: 'Monitor',
          title: 'Корпоративные сайты',
          description: 'Разработка многостраничных сайтов для бизнеса. Презентация компании, услуг и продуктов.',
          price: 'от 50 000 ₽'
        },
        {
          iconName: 'ShoppingBag',
          title: 'Интернет-магазины',
          description: 'Полноценные решения для электронной коммерции. Каталог, корзина, онлайн-оплата.',
          price: 'от 80 000 ₽'
        },
        {
          iconName: 'PenTool',
          title: 'Лендинги',
          description: 'Продающие одностраничные сайты для конкретных товаров или услуг. Высокая конверсия.',
          price: 'от 25 000 ₽'
        },
        {
          iconName: 'Database',
          title: 'Веб-сервисы',
          description: 'Сложные веб-приложения с личными кабинетами, базами данных и сложной логикой.',
          price: 'Индивидуально'
        },
        {
          iconName: 'Search',
          title: 'SEO Оптимизация',
          description: 'Внутренняя оптимизация сайта для лучшего ранжирования в поисковых системах.',
          price: 'от 15 000 ₽'
        },
        {
          iconName: 'Settings',
          title: 'Техподдержка',
          description: 'Обслуживание сайтов, обновление контента, защита от вирусов и мониторинг.',
          price: 'от 5 000 ₽/мес'
        }
      ];
      
      await Service.bulkCreate(defaultServices);
      console.log('Default services created');
    }

    // Check if settings exist (optional, defaults are handled in code if missing, but good to have in DB)
    // Actually, backend returns empty object if missing, frontend fills defaults.
    // But better to persist defaults if we want them editable immediately.
    
  } catch (error) {
    console.error('Seeding error:', error);
  }
};
