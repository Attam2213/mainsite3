import express from 'express';
import { Lead, Site, User } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Create a new lead (public endpoint, called from the user's site)
router.post('/', async (req, res) => {
  try {
    const { siteId, name, email, phone, message } = req.body;

    if (!siteId || !name || !email || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify site exists
    const site = await Site.findByPk(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const lead = await Lead.create({
      siteId,
      name,
      email,
      phone,
      message,
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Error submitting lead' });
  }
});

// Get leads for a specific site (protected)
router.get('/site/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;
    
    // Check ownership
    const site = await Site.findOne({
      where: { id: siteId, userId: req.user!.id }
    });

    if (!site) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leads = await Lead.findAll({
      where: { siteId },
      order: [['createdAt', 'DESC']]
    });

    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// Get all leads for the logged-in user (across all sites)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Find all sites owned by user
    const sites = await Site.findAll({
      where: { userId },
      attributes: ['id', 'domain', 'settings']
    });

    const siteIds = sites.map(site => site.id);

    const leads = await Lead.findAll({
      where: { siteId: siteIds },
      include: [{
        model: Site,
        as: 'site',
        attributes: ['domain', 'settings']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(leads);
  } catch (error) {
    console.error('Error fetching all leads:', error);
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// Update lead status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const lead = await Lead.findByPk(id, {
      include: [{ model: Site, as: 'site' }]
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify ownership via Site
    const site = lead.get('site') as any; // or use type assertion
    if (!site || site.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    lead.status = status;
    await lead.save();

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ message: 'Error updating lead' });
  }
});

// Delete lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const lead = await Lead.findByPk(id, {
      include: [{ model: Site, as: 'site' }]
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify ownership via Site
    const site = lead.get('site') as any;
    if (!site || site.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await lead.destroy();

    res.json({ message: 'Lead deleted' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Error deleting lead' });
  }
});

export default router;
