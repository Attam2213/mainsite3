import sequelize from './config/database';
import { ServerNode } from './models';

async function check() {
  try {
    const nodes = await ServerNode.findAll();
    console.log('Nodes in DB:', JSON.stringify(nodes, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
