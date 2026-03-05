
import express from 'express';
import { Server, Site } from '../models';
import { authenticateAgent, AgentRequest } from '../middleware/agentAuth';

const router = express.Router();

// Heartbeat endpoint
router.post('/heartbeat', authenticateAgent, async (req: AgentRequest, res: any) => {
  try {
    const server = req.serverAgent!;
    const { load, memory, disk, ipAddress } = req.body;

    // Update server status
    if (load !== undefined) server.currentLoad = Math.round(load);
    if (ipAddress) server.ipAddress = ipAddress;
    
    // We could store detailed stats in a separate table if needed
    // For now, just updating the main server record
    
    server.status = 'active'; // If it's sending heartbeats, it's active
    await server.save();

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ message: 'Error processing heartbeat' });
  }
});

// Get pending tasks (sites to create/delete)
router.get('/tasks', authenticateAgent, async (req: AgentRequest, res: any) => {
  try {
    const server = req.serverAgent!;

    // Find sites assigned to this server that are 'pending' (need creation)
    // or 'suspended' (might need stopping) - for now just 'pending'
    const pendingSites = await Site.findAll({
      where: {
        serverId: server.id,
        status: 'pending'
      }
    });

    // We can also add logic for deleted sites if we had a 'deleting' status
    
    const tasks = pendingSites.map(site => ({
      id: site.id,
      type: 'create_site',
      payload: {
        domain: site.domain,
        settings: site.settings,
        cmsVersion: site.cmsVersion
      }
    }));

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Complete a task
router.post('/tasks/:id/complete', authenticateAgent, async (req: AgentRequest, res: any) => {
  try {
    const { id } = req.params;
    const { success, error } = req.body;

    const site = await Site.findByPk(id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (success) {
      site.status = 'active';
      await site.save();
    } else {
      // Log error, maybe set status to 'failed'
      console.error(`Task failed for site ${id}:`, error);
      // We might want to keep it pending or set to a failed state
      // For now, let's keep it pending so it retries, or maybe 'suspended'
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Error completing task' });
  }
});

export default router;
