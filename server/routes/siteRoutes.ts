import express from 'express';
import { Site, Server, User } from '../models';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { WebnamesRegistrar } from '../services/WebnamesRegistrar';
import { cmsTemplates } from '../config/cmsTemplates';

const registrar = new WebnamesRegistrar({
  username: process.env.WEBNAMES_USERNAME || 'test',
  password: process.env.WEBNAMES_PASSWORD || 'test',
  testMode: process.env.NODE_ENV !== 'production'
});

const router = express.Router();

// Get templates
router.get('/templates', (req, res) => {
  const templates = Object.entries(cmsTemplates).map(([key, t]: [string, any]) => ({
    id: key,
    title: t.title,
    description: t.description,
    preview: t.sections.find((s: any) => s.type === 'hero')?.image || null
  }));
  res.json(templates);
});

// Get user's sites
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const sites = await Site.findAll({
      where: { userId: req.user.id },
      include: [{ model: Server, as: 'server', attributes: ['name', 'ipAddress'] }]
    });
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ message: 'Error fetching sites' });
  }
});

// Get single site
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const site = await Site.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Server, as: 'server', attributes: ['name', 'ipAddress'] }]
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ message: 'Error fetching site' });
  }
});

// Create new site
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { domain, settings, registerDomain, skipDomain, template } = req.body;

    let finalDomain = domain;
    let initialSettings = settings || {};

    if (template && cmsTemplates[template as keyof typeof cmsTemplates]) {
        // @ts-ignore
        const templateData = cmsTemplates[template as keyof typeof cmsTemplates];
        initialSettings = {
            ...initialSettings,
            title: templateData.title,
            description: templateData.description,
            primaryColor: templateData.primaryColor,
            fontFamily: templateData.fontFamily,
            sections: templateData.sections.map((s: any) => ({ ...s, id: uuidv4() })) // Clone sections with new IDs
        };
    } else if (!settings) {
        // Default to empty template if no settings provided
        const emptyTemplate = cmsTemplates.empty;
        initialSettings = {
            title: 'New Site',
            primaryColor: '#4f46e5',
            fontFamily: 'Inter',
            sections: emptyTemplate.sections.map((s: any) => ({ ...s, id: uuidv4() }))
        };
    }

    if (skipDomain) {
      // Generate a temporary domain
      finalDomain = `project-${uuidv4().split('-')[0]}.local`;
    } else if (!domain) {
      return res.status(400).json({ message: 'Domain is required' });
    }

    // Check if domain exists in our DB
    const existingSite = await Site.findOne({ where: { domain: finalDomain } });
    if (existingSite) {
      // If it's a temp domain collision (rare), try one more time or just fail (user can retry)
      if (skipDomain) {
         finalDomain = `project-${uuidv4().split('-')[0]}-${Math.floor(Math.random()*1000)}.local`;
      } else {
         return res.status(400).json({ message: 'Domain is already taken on our platform' });
      }
    }

    // If registration requested, check availability and register
    if (registerDomain && !skipDomain) {
      const isAvailable = await registrar.checkAvailability(finalDomain);
      if (!isAvailable) {
        return res.status(400).json({ message: 'Domain is not available for registration' });
      }
      
      // Fetch user details for registration
      const user = await User.findByPk(req.user.id);
      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      // Attempt registration
      try {
        await registrar.registerDomain(finalDomain, {
          email: user.email,
          phone: '+79990000000', // Placeholder - should come from user profile
          address: 'Russia, Moscow' // Placeholder
        });
      } catch (regError: any) {
        console.error('Domain registration failed:', regError);
        return res.status(500).json({ message: 'Failed to register domain: ' + (regError.message || 'Unknown error') });
      }
    }


    // Find available server
    const server = await Server.findOne({
      where: { status: 'active' },
      order: [['currentLoad', 'ASC']]
    });

    if (!server) {
      return res.status(503).json({ message: 'No available servers at the moment. Please contact support.' });
    }

    if (server.capacity > 0 && server.currentLoad >= server.capacity) {
        return res.status(503).json({ message: 'All servers are at full capacity.' });
    }

    const site = await Site.create({
      userId: req.user.id,
      serverId: server.id,
      domain: finalDomain,
      settings: initialSettings,
      status: 'pending', // Provisioning starts
      cmsVersion: '1.0.0'
    });

    // Increment server load
    await server.increment('currentLoad');

    // Reload site with server details to return full info
    const siteWithServer = await Site.findByPk(site.id, {
      include: [{ model: Server, as: 'server', attributes: ['name', 'ipAddress'] }]
    });

    res.status(201).json(siteWithServer);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ message: 'Error creating site' });
  }
});

// Update site settings
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { settings, domain } = req.body;
    const site = await Site.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (domain && domain !== site.domain) {
        // Check uniqueness
        const existing = await Site.findOne({ where: { domain } });
        if (existing) {
            return res.status(400).json({ message: 'Domain is already taken' });
        }
        site.domain = domain;
    }

    if (settings) {
        site.settings = { ...site.settings, ...settings };
    }

    await site.save();
    res.json(site);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ message: 'Error updating site' });
  }
});

// Delete site
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const whereClause: any = { id: req.params.id };
    
    // Allow admin to delete any site, otherwise only owner can delete
    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    }

    const site = await Site.findOne({
      where: whereClause
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Decrement server load if server was assigned
    if (site.serverId) {
        const server = await Server.findByPk(site.serverId);
        if (server) {
            await server.decrement('currentLoad');
        }
    }

    await site.destroy();
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ message: 'Error deleting site' });
  }
});

export default router;
