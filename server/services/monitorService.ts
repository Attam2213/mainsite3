import axios from 'axios';
import { Op } from 'sequelize';
import Project from '../models/Project';
import https from 'https';

const CHECK_INTERVAL = 60 * 1000; // 1 minute (for testing)

const agent = new https.Agent({  
  rejectUnauthorized: false
});

export const checkWebsites = async () => {
  try {
    const projects = await Project.findAll({
      where: {
        websiteUrl: {
          [Op.ne]: null
        }
      }
    });

    console.log(`[Monitor] Checking ${projects.length} websites...`);

    for (const project of projects) {
      if (!project.websiteUrl) continue;

      let url = project.websiteUrl;
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }

      try {
        // Check with relaxed SSL validation for dev/localhost
        await axios.get(url, { 
          timeout: 5000,
          httpsAgent: agent 
        });

        await project.update({ 
          siteStatus: 'up', 
          lastChecked: new Date() 
        });
      } catch (error: any) {
        console.error(`[Monitor] Website ${url} (Project ${project.id}) is DOWN: ${error.message}`);
        await project.update({ 
          siteStatus: 'down', 
          lastChecked: new Date() 
        });
      }
    }
  } catch (error) {
    console.error('[Monitor] Error checking websites:', error);
  }
};

export const startMonitoring = () => {
  // Initial check after 10 seconds to allow server to start
  setTimeout(checkWebsites, 10000);
  
  // Schedule periodic checks
  setInterval(checkWebsites, CHECK_INTERVAL);
  console.log('[Monitor] Website monitoring service started.');
};
