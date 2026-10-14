import { Router } from 'express';
import { trackEvent, getStats } from '../controllers/analyticsController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Public: track a page view
router.post('/track', trackEvent);

// Admin only: get aggregated stats
router.get('/stats', authenticateToken, isAdmin, getStats);

export default router;
