import 'dotenv/config';
import sequelize from './server/config/database';
import { WebSite, ServerNode } from './server/models/index';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB auth ok');
    const id = '74014d7d-bffb-43f9-abc0-80e98a84594d';
    console.log('WebSite.associations:', Object.keys((WebSite as any).associations || {}));

    const s1 = await WebSite.findByPk(id);
    console.log('\nA) findByPk keys:', Object.keys((s1 as any).toJSON()));
    console.log('   s1.node type=', typeof (s1 as any).node, ' ip=', (s1 as any).node?.ip);

    const s2 = await (WebSite as any).findOne({
      where: { id },
      include: [{ model: ServerNode, as: 'node' }],
    });
    console.log('\nB) findOne include: model+as keys:', Object.keys((s2 as any).toJSON()));
    console.log('   s2.node type=', typeof (s2 as any).node, ' ip=', (s2 as any).node?.ip);

    const s3 = await (WebSite as any).findOne({
      where: { id },
      include: ['node'],
    });
    console.log('\nC) findOne include ["node"] keys:', Object.keys((s3 as any).toJSON()));
    console.log('   s3.node type=', typeof (s3 as any).node, ' ip=', (s3 as any).node?.ip);

    process.exit(0);
  } catch (e: any) {
    console.error('ERR MSG:', e?.message);
    console.error('ERR PARENT:', e?.parent?.message || '');
    console.error('ERR:', e?.stack || e);
    process.exit(1);
  }
})();
