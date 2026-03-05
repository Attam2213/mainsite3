import express from 'express';
import { createOrder, getOrders, updateOrder, cancelOrder } from '../controllers/orderController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getOrders);
router.put('/:id/cancel', authenticateToken, cancelOrder);
router.put('/:id', authenticateToken, isAdmin, updateOrder);

export default router;
