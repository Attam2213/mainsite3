import express from 'express';
import {
  getAllServices,
  getAllServicesAdmin,
  getServiceById,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', getAllServices);
router.get('/admin', authenticateToken, isAdmin, getAllServicesAdmin);
router.get('/:id', getServiceById);
router.post('/', authenticateToken, isAdmin, createService);
router.put('/:id', authenticateToken, isAdmin, updateService);
router.delete('/:id', authenticateToken, isAdmin, deleteService);

export default router;
