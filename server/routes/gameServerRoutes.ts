import express from 'express';
import { createGameServer, getGameServers, controlServer, orderGameServer } from '../controllers/gameServerController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Admin creates server (or via payment logic)
router.post('/', authenticateToken, isAdmin, createGameServer);
router.post('/order', authenticateToken, orderGameServer);
router.get('/', authenticateToken, getGameServers);
router.post('/:id/control', authenticateToken, controlServer);

export default router;
