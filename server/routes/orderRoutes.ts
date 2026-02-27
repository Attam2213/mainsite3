import express from 'express';
import { createOrder, getOrders, updateOrder } from '../controllers/orderController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getOrders);
router.put('/:id', authenticateToken, isAdmin, updateOrder);

export default router;
