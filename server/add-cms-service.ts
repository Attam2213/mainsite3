
import { Service } from './models';
import sequelize from './config/database';

const addCmsService = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const serviceData = {
      title: 'CMS / VDS Хостинг',
      description: 'Аренда части VDS сервера с предустановленной CMS для создания лендингов. Включает хостинг и управление доменами.',
      price: 'от 500 ₽/мес',
      features: ['Выделенные ресурсы', 'Предустановленная CMS', 'Домен в подарок', 'Техническая поддержка', 'Панель управления'],
      icon: 'Cloud',
      color: 'bg-orange-500'
    };

    const existingService = await Service.findOne({ where: { title: serviceData.title } });

    if (!existingService) {
      await Service.create(serviceData);
      console.log('CMS Service added successfully.');
    } else {
      console.log('CMS Service already exists.');
    }

  } catch (error) {
    console.error('Error adding CMS service:', error);
  } finally {
    await sequelize.close();
  }
};

addCmsService();
