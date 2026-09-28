#!/bin/bash
cd /root/mainsite3
echo "=== pm2 logs last 300 lines (errors only) ==="
pm2 logs mainsite --nostream --lines 300 --out /tmp/m.out --err /tmp/m.err 2>/dev/null
cat /tmp/m.err | grep -iE 'error|exception|delete|game.?server' | tail -80
echo ''
echo '=== Full last 50 lines of stderr ==='
tail -60 /tmp/m.err
echo ''
echo "=== DB check servers with UUIDs from user console: 2238699c and 7500d333 exist? node eager load works? ==="
node -e "
require('tsx').register();
(async () => {
  const { sequelize } = require('./server/models/index.ts');
  const GameServer = require('./server/models/GameServer.ts').default;
  const ServerNode = require('./server/models/ServerNode.ts').default;
  const ids = ['2238699c-75ea-4b16-ae4b-a6b3ce2e61e6', '7500d333-5b3b-4154-8050-c4cf74b328b2'];
  for (const id of ids) {
    const s = await GameServer.findByPk(id, { include: [{ model: ServerNode, as: 'node' }] });
    if (!s) { console.log('SERVER', id, 'NOT FOUND IN DB'); continue; }
    const obj = s.toJSON();
    console.log('--- Server', id, '---');
    console.log('  status:', obj.status, 'userId:', obj.userId, 'containerId:', obj.containerId ? 'SET' : 'NULL');
    console.log('  nodeId:', obj.nodeId);
    console.log('  node eager loaded:', obj.node ? ('YES name=' + obj.node.name + ' ip=' + obj.node.ip + ' sshUser=' + (obj.node.sshUser || 'undef') + ' sshPass=' + (obj.node.sshPassword ? 'SET('+obj.node.sshPassword.length+')' : 'NULL') + ' sshPort=' + obj.node.sshPort) : 'NULL/UNDEFINED');
  }
  await sequelize.close();
})().catch(e => { console.error('node script err:', e?.message || e); process.exit(1); });
"
echo ''
echo '=== Health ==='
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:5000/api/health
echo Done
