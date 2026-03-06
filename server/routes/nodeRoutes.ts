import express from 'express';
import { createNode, getNodes, deleteNode } from '../controllers/nodeController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, isAdmin, createNode);
router.get('/', authenticateToken, isAdmin, getNodes);
router.delete('/:id', authenticateToken, isAdmin, deleteNode);

export default router;
