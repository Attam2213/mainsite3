import express from 'express';
import {
  getAllPortfolioItems,
  getPortfolioItemById,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from '../controllers/portfolioController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', getAllPortfolioItems);
router.get('/:id', getPortfolioItemById);
router.post('/', authenticateToken, isAdmin, createPortfolioItem);
router.put('/:id', authenticateToken, isAdmin, updatePortfolioItem);
router.delete('/:id', authenticateToken, isAdmin, deletePortfolioItem);

export default router;
