import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

router.get('/', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);

export default router;
