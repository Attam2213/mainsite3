import express from 'express';
import { PortfolioItem } from '../models/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await PortfolioItem.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create item (Admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const item = await PortfolioItem.create(req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update item
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const item = await PortfolioItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const item = await PortfolioItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    await item.destroy();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
