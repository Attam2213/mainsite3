import { Request, Response } from 'express';
import { Project, User } from '../models';

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] }
      ],
      order: [['updatedAt', 'DESC']]
    });
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Ошибка при получении проектов' });
  }
};

export const getMyProject = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    // Fetch all projects for the client
    const projects = await Project.findAll({
      where: { clientId: userId },
      order: [['createdAt', 'DESC']]
    });
    
    // Return array of projects
    res.json(projects);
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ message: 'Ошибка при получении проектов' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, budget, deadline, clientId, status, progress, serverIp, websiteUrl } = req.body;
    
    const project = await Project.create({
      title,
      budget,
      deadline,
      clientId,
      status: status || 'pending',
      progress: progress || 0,
      serverIp,
      websiteUrl
    });
    
    const projectWithClient = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'client', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json(projectWithClient);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Ошибка при создании проекта' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByPk(req.params.id as string);
    if (!project) {
      res.status(404).json({ message: 'Проект не найден' });
      return;
    }
    
    await project.update(req.body);
    
    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'client', attributes: ['id', 'name', 'email'] }]
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении проекта' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByPk(req.params.id as string);
    if (!project) {
      res.status(404).json({ message: 'Проект не найден' });
      return;
    }
    await project.destroy();
    res.json({ message: 'Проект удален' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Ошибка при удалении проекта' });
  }
};
