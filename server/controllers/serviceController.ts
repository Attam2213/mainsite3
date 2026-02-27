import { Request, Response } from 'express';
import Service from '../models/Service';

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении услуг' });
  }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByPk(req.params.id as string);
    if (!service) {
      res.status(404).json({ message: 'Услуга не найдена' });
      return;
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении услуги' });
  }
};

export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Ошибка при создании услуги' });
  }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByPk(req.params.id as string);
    if (!service) {
      res.status(404).json({ message: 'Услуга не найдена' });
      return;
    }
    await service.update(req.body);
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении услуги' });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByPk(req.params.id as string);
    if (!service) {
      res.status(404).json({ message: 'Услуга не найдена' });
      return;
    }
    await service.destroy();
    res.json({ message: 'Услуга удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении услуги' });
  }
};
