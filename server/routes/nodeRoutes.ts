import express from 'express';
import { createNode, getNodes, getPublicNodes, deleteNode, updateNode } from '../controllers/nodeController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/public', getPublicNodes);
router.post('/', authenticateToken, isAdmin, createNode);
router.get('/', authenticateToken, isAdmin, getNodes);
router.put('/:id', authenticateToken, isAdmin, updateNode);
router.delete('/:id', authenticateToken, isAdmin, deleteNode);

export default router;
