require('dotenv').config();
const { WebSite, ServerNode, sequelize } = require('./server/models');
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB OK');
    const id = '74014d7d-bffb-43f9-abc0-80e98a84594d';
    const s1 = await WebSite.findByPk(id);
    console.log('A) findByPk → keys:', Object.keys(s1.toJSON()));
    console.log('   s1.node?', typeof s1.node, s1.node?.ip);
    const s2 = await WebSite.findOne({ where: { id }, include: [{ model: ServerNode, as: 'node' }] });
    console.log('B) findOne include node → keys:', Object.keys(s2.toJSON()));
    console.log('   s2.node?', typeof s2.node, s2.node?.ip);
    const s3 = await WebSite.findOne({ where: { id }, include: ['node'] });
    console.log('C) findOne include ["node"] → keys:', Object.keys(s3.toJSON()));
    console.log('   s3.node?', typeof s3.node, s3.node?.ip);
    const assoc = Object.keys((WebSite.associations || {}));
    console.log('WebSite associations:', assoc);
    process.exit(0);
  } catch (e) {
    console.error('ERR:', e);
    process.exit(1);
  }
})();
