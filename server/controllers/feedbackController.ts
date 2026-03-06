import { Request, Response } from 'express';
import { Feedback } from '../models';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { email, telegram, message } = req.body;
    if (!email || !message) {
        res.status(400).json({ message: 'Email and message are required' });
        return;
    }
    const feedback = await Feedback.create({ email, telegram, message });
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Error creating feedback' });
  }
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await Feedback.findAll({ order: [['createdAt', 'DESC']] });
    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ message: 'Error fetching feedbacks' });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await Feedback.update({ status }, { where: { id } });
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Feedback.destroy({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting' });
    }
};
