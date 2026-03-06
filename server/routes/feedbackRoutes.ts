import express from 'express';
import { createFeedback, getAllFeedbacks, updateFeedbackStatus, deleteFeedback } from '../controllers/feedbackController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public
router.post('/', createFeedback);

// Admin only
router.get('/', authenticateToken, isAdmin, getAllFeedbacks);
router.put('/:id', authenticateToken, isAdmin, updateFeedbackStatus);
router.delete('/:id', authenticateToken, isAdmin, deleteFeedback);

export default router;
