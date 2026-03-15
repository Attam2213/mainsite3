
import { Service } from './models';
import sequelize from './config/database';

const addGameServices = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const services = [
      {
        title: 'Minecraft Hosting',
        description: 'Производительные серверы для любых версий Minecraft. Поддержка модов и плагинов.',
        price: 'от 299 ₽/мес',
        features: ['Панель управления', 'FTP доступ', 'Защита от DDoS', 'Автобэкапы', 'MySQL базы'],
        icon: 'Box',
        color: 'bg-green-600'
      },
      {
        title: 'Counter-Strike 2',
        description: 'Стабильные серверы с высоким тикрейтом для комфортной игры.',
        price: 'от 499 ₽/мес',
        features: ['128 Tickrate', 'FastDL', 'SourceMod', 'FTP доступ', 'Защита от DDoS'],
        icon: 'Crosshair',
        color: 'bg-orange-500'
      },
      {
        title: 'Counter-Strike 1.6',
        description: 'Классические серверы CS 1.6 с поддержкой AMX Mod X.',
        price: 'от 199 ₽/мес',
        features: ['1000 FPS', 'FastDL', 'AMX Mod X', 'FTP доступ', 'Защита от DDoS'],
        icon: 'Target',
        color: 'bg-yellow-500'
      }
    ];

    for (const serviceData of services) {
      const existingService = await Service.findOne({ where: { title: serviceData.title } });

      if (!existingService) {
        await Service.create(serviceData);
        console.log(`Service "${serviceData.title}" added successfully.`);
      } else {
        console.log(`Service "${serviceData.title}" already exists.`);
      }
    }

  } catch (error) {
    console.error('Error adding game services:', error);
  } finally {
    await sequelize.close();
  }
};

addGameServices();
