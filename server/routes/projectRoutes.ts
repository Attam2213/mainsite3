import express from 'express';
import {
  getAllProjects,
  getMyProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Admin routes
router.get('/', authenticateToken, isAdmin, getAllProjects);
router.post('/', authenticateToken, isAdmin, createProject);
router.put('/:id', authenticateToken, isAdmin, updateProject);
router.delete('/:id', authenticateToken, isAdmin, deleteProject);

// Client routes
router.get('/my', authenticateToken, getMyProject);

export default router;
