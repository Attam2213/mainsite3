import sequelize from './config/database';
import { Service, PortfolioItem, User } from './models';
import bcrypt from 'bcryptjs';

const seedServices = [
  {
    title: 'Landing Page',
    description: 'Одностраничный сайт для презентации вашего продукта или услуги. Идеально для старта продаж.',
    price: 'от 15 000 ₽',
    features: ['Уникальный дизайн', 'Адаптивная верстка', 'SEO-оптимизация', 'Форма заявки'],
    icon: 'Monitor',
    color: 'bg-blue-500'
  },
  {
    title: 'Корпоративный сайт',
    description: 'Многостраничный сайт компании. Расскажите о себе, своих услугах и новостях.',
    price: 'от 40 000 ₽',
    features: ['До 10 страниц', 'Админ-панель', 'Блог / Новости', 'Интеграция с CRM'],
    icon: 'Database',
    color: 'bg-purple-500'
  },
  {
    title: 'Интернет-магазин',
    description: 'Полноценный магазин с каталогом, корзиной и онлайн-оплатой.',
    price: 'от 80 000 ₽',
    features: ['Каталог товаров', 'Корзина и оформление', 'Онлайн-оплата', 'Личный кабинет'],
    icon: 'Code2',
    color: 'bg-indigo-500'
  },
  {
    title: 'Веб-приложение (SaaS)',
    description: 'Сложные сервисы и порталы с уникальным функционалом под ваши задачи.',
    price: 'Индивидуально',
    features: ['Сложная логика', 'Базы данных', 'API интеграции', 'Высокая нагрузка'],
    icon: 'Shield',
    color: 'bg-green-500'
  }
];

const seedPortfolio = [
  {
    title: 'E-commerce Platform',
    category: 'shop',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Полнофункциональный интернет-магазин с админ-панелью.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    link: '#',
    github: '#'
  },
  {
    title: 'Corporate Website',
    category: 'landing',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Корпоративный сайт для финансовой компании.',
    tags: ['Next.js', 'Tailwind', 'Framer Motion'],
    link: '#',
    github: '#'
  },
  {
    title: 'Task Manager App',
    category: 'app',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Приложение для управления задачами команды.',
    tags: ['React', 'Redux', 'Firebase'],
    link: '#',
    github: '#'
  },
  {
    title: 'Portfolio Theme',
    category: 'landing',
    imageUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Креативная тема для портфолио фотографа.',
    tags: ['Vue.js', 'GSAP'],
    link: '#',
    github: '#'
  },
  {
    title: 'SaaS Dashboard',
    category: 'app',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Аналитическая панель для SaaS сервиса.',
    tags: ['React', 'D3.js', 'Express'],
    link: '#',
    github: '#'
  },
  {
    title: 'Real Estate Platform',
    category: 'shop',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Платформа для поиска и аренды недвижимости.',
    tags: ['Next.js', 'Prisma', 'PostgreSQL'],
    link: '#',
    github: '#'
  }
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Check if data exists
    const servicesCount = await Service.count();
    const portfolioCount = await PortfolioItem.count();
    const usersCount = await User.count();

    if (servicesCount === 0) {
      await Service.bulkCreate(seedServices);
      console.log('Services seeded');
    }

    if (portfolioCount === 0) {
      await PortfolioItem.bulkCreate(seedPortfolio);
      console.log('Portfolio seeded');
    }

    if (usersCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      
      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user seeded: admin@example.com / admin');
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
