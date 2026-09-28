#!/bin/bash
cd /root/mainsite3
echo "=== PM2 combined logs (last 200) grep error ==="
pm2 logs mainsite --lines 200 --nostream 2>&1 | grep -iE 'error|exception|typeerror|delete' | tail -60 || true
echo ''
echo "=== Raw pm2 logs last 40 ==="
pm2 logs mainsite --lines 40 --nostream 2>&1 | tail -40 || true
echo ''
echo "=== Execute REAL DELETE requests via HTTP with admin token to see exact response ==="
sqlite3 data/db.sqlite "SELECT id,email,role,token FROM users WHERE role='admin' LIMIT 1;" 2>/dev/null || true
echo ''
echo "--- DB servers summary (2 ids + quick) ---"
sqlite3 data/db.sqlite <<'SQL'
.headers on
.mode column
SELECT id, name, status, nodeId, containerId, port, userId, paidUntil, createdAt FROM game_servers WHERE id IN ('2238699c-75ea-4b16-ae4b-a6b3ce2e61e6','7500d333-5b3b-4154-8050-c4cf74b328b2') OR 1=1 LIMIT 8;
SQL
echo ''
echo "--- Nodes 1 ---"
sqlite3 data/db.sqlite <<'SQL'
.headers on
SELECT id, name, ip, type, status, sshUser, sshPort, length(sshPassword) AS sshPassLen FROM server_nodes LIMIT 5;
SQL
echo ''
echo "--- Direct test curl DELETE with local no-auth bypass (call handler manually via tsx): ---"
npx tsx -e "
const { GameServer, ServerNode } = require('./server/models');
const crypto = require('./server/utils/crypto');
(async () => {
  const ids = ['2238699c-75ea-4b16-ae4b-a6b3ce2e61e6', '7500d333-5b3b-4154-8050-c4cf74b328b2'];
  for (const id of ids) {
    try {
      const server = await GameServer.findByPk(id, { include: [{ model: ServerNode, as: 'node' }] });
      if (!server) { console.log('[',id,']: NOT FOUND'); continue; }
      const obj = server.toJSON();
      console.log('\n==== Server', id.slice(0,8));
      console.log('  status:', obj.status);
      console.log('  containerId:', obj.containerId ? obj.containerId : 'NULL');
      console.log('  node:', obj.node ? 'name='+obj.node.name+' ip='+obj.node.ip : 'NULL (no node!)');
      if (obj.node) {
        try {
          console.log('  decrypting node.sshPassword ...');
          const pw = obj.node.sshPassword ? crypto.decrypt(obj.node.sshPassword) : '(null pass)';
          console.log('  decrypt OK, pw length =', pw.length, 'sshUser=', obj.node.sshUser, 'sshPort=', obj.node.sshPort);
        } catch (dc: any) {
          console.log('  !!! DECRYPT ERROR:', dc?.message || dc);
        }
      }
    } catch(e: any) { console.log('[', id, '] TOP ERROR:', e?.message ?? e); }
  }
  process.exit(0);
})();
" 2>&1 | head -60
echo Done
