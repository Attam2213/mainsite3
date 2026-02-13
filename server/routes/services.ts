import express from 'express';
import { Service } from '../models/Service.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create service (Admin only - check role ideally)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update service
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    await service.update(req.body);
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    await service.destroy();
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
