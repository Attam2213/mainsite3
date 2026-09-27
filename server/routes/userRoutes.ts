import express from 'express';
import { getAllUsers, getUserById, updateUserRole } from '../controllers/userController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, isAdmin, getAllUsers);
router.get('/:id', authenticateToken, isAdmin, getUserById);
router.patch('/:id/role', authenticateToken, isAdmin, updateUserRole);

export default router;
