
import { Server } from '../server/models/index';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    const servers = await Server.findAll();
    console.log('Servers found:', JSON.stringify(servers, null, 2));

    if (servers.length === 0) {
      console.log('No servers found. Creating a dummy server for development...');
      const server = await Server.create({
        name: 'Dev Server',
        ipAddress: '127.0.0.1',
        status: 'active',
        capacity: 10,
        currentLoad: 0,
        token: 'dev-token-' + Date.now()
      });
      console.log('Created server:', JSON.stringify(server, null, 2));
    }
  } catch (error) {
    console.error('Error checking/creating servers:', error);
  }
}

check();
