
import sequelize from './config/database';
import { User, Service, PortfolioItem, Order, Message } from './models';
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
    await sequelize.sync({ force: true }); // Use force: true to recreate tables
    console.log('Database synced (force: true).');

    // Create Services
    const services = await Promise.all(
      seedServices.map(service => Service.create(service))
    );
    console.log('Services seeded');

    // Create Portfolio Items
    await Promise.all(
      seedPortfolio.map(item => PortfolioItem.create(item))
    );
    console.log('Portfolio seeded');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('Admin user seeded: admin@example.com / admin');

    // Create Client User
    const clientPassword = await bcrypt.hash('password123', 10);
    const client = await User.create({
      name: 'Test Client',
      email: 'client@example.com',
      password: clientPassword,
      role: 'client'
    });
    console.log('Client user seeded: client@example.com / password123');

    // Create Order
    const order = await Order.create({
      userId: client.id,
      serviceId: services[0].id,
      status: 'in_progress'
    });
    console.log('Order created:', order.id);

    // Create Messages
    // Unread message from Admin to Client
    await Message.create({
      orderId: order.id,
      senderId: admin.id,
      content: 'Hello! Please review the latest update.',
      isRead: false
    });

    await Message.create({
      orderId: order.id,
      senderId: admin.id,
      content: 'We need your feedback on the design.',
      isRead: false
    });

    // Read message from Admin to Client
    await Message.create({
      orderId: order.id,
      senderId: admin.id,
      content: 'Project started.',
      isRead: true
    });

    // Unread message from Client to Admin (for Admin Dashboard check)
    await Message.create({
      orderId: order.id,
      senderId: client.id,
      content: 'Hi Admin, I have a question about the invoice.',
      isRead: false
    });

    console.log('Messages seeded.');
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

seed();
