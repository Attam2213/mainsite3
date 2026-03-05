import express from 'express';
import { Server, Site } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware to check for admin role
const isAdmin = (req: any, res: express.Response, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Get all servers
router.get('/', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const servers = await Server.findAll({
      include: [{ model: Site, as: 'sites', attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    });
    
    const serversWithCount = await Promise.all(servers.map(async (server: any) => {
      const s = server.toJSON();
      const realLoad = s.sites ? s.sites.length : 0;
      
      // Self-heal: update DB if mismatch
      if (server.currentLoad !== realLoad) {
          server.currentLoad = realLoad;
          await server.save();
      }
      
      s.currentLoad = realLoad;
      delete s.sites;
      return s;
    }));

    res.json(serversWithCount);
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({ message: 'Error fetching servers' });
  }
});

// Create a new server
router.post('/', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { name, ipAddress, capacity } = req.body;
    
    // Generate a unique token for the server agent
    const token = uuidv4();

    const server = await Server.create({
      name,
      ipAddress,
      token,
      capacity: capacity || 10,
      status: 'provisioning',
    });

    res.status(201).json(server);
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ message: 'Error creating server' });
  }
});

// Get sites on a server
router.get('/:id/sites', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const sites = await Site.findAll({
      where: { serverId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(sites);
  } catch (error) {
    console.error('Error fetching server sites:', error);
    res.status(500).json({ message: 'Error fetching server sites' });
  }
});

// Update server status (called by the server agent or admin)
// Note: In a real scenario, the agent would use a different auth mechanism with the token
router.patch('/:id/status', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { status, ipAddress, currentLoad } = req.body;
    const server = await Server.findByPk(req.params.id);

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (status) server.status = status;
    if (ipAddress) server.ipAddress = ipAddress;
    if (currentLoad !== undefined) server.currentLoad = currentLoad;

    await server.save();
    res.json(server);
  } catch (error) {
    console.error('Error updating server:', error);
    res.status(500).json({ message: 'Error updating server' });
  }
});

// Delete a server
router.delete('/:id', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const server = await Server.findByPk(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    await server.destroy();
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({ message: 'Error deleting server' });
  }
});

export default router;