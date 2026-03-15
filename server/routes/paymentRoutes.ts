import express from 'express';
import { Invoice, User, Project, GameServer, ServerNode } from '../models';
import { authenticateToken } from '../middleware/auth';
import { plategaService } from '../services/PlategaService';
import { execCommand, startPM2Process } from '../services/sshService';
import { decrypt } from '../utils/crypto';
import { Request, Response } from 'express';

const router = express.Router();

// Create payment for invoice
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { invoiceId, paymentMethod = 2 } = req.body as { invoiceId: string; paymentMethod?: number }; // Default to SBP (2)
    const origin = req.get('origin') || req.get('referer') || '';
    const baseUrl =
      process.env.FRONTEND_URL ||
      (typeof origin === 'string' && origin.startsWith('http') ? origin.replace(/\/+$/, '') : '') ||
      'http://localhost:5173';

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const result = await plategaService.createPayment({
      paymentMethod,
      paymentDetails: {
        amount: invoice.amount,
        currency: 'RUB'
      },
      description: `Invoice #${invoice.id} payment`,
      return: `${baseUrl}/client/invoices?success=true&invoiceId=${invoice.id}`,
      failedUrl: `${baseUrl}/client/invoices?success=false&invoiceId=${invoice.id}`,
      payload: invoice.id
    });

    if (result.success && result.data) {
      res.json({ url: result.data.url });
    } else {
      res.status(500).json({ message: result.error || 'Failed to create payment' });
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body));

    const { status, payload, transaction } = req.body as unknown as {
      status?: string;
      payload?: string;
      transaction?: { payload?: string; status?: string };
    };
    
    // Extract invoiceId from payload (sent during creation)
    // If payload is not at top level, check if it's inside transaction
    let invoiceId = payload;
    if (!invoiceId && transaction && transaction.payload) {
        invoiceId = transaction.payload;
    }

    // Check status
    // Docs say: PENDING, CANCELED, CONFIRMED, CHARGEBACKED
    let isPaid = false;
    const currentStatus = status || (transaction && transaction.status);
    
    if (currentStatus === 'CONFIRMED' || currentStatus === 'paid' || currentStatus === 'success') {
      isPaid = true;
    }

    if (isPaid && invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);
      if (invoice && invoice.status !== 'paid') {
        invoice.status = 'paid';
        await invoice.save();
        console.log(`Invoice ${invoiceId} marked as paid via webhook`);

        // Handle Subscription Logic
        if (invoice.type === 'monthly' && invoice.projectId) {
            const project = await Project.findByPk(invoice.projectId);
            if (project) {
                // Determine start date
                let startDate = new Date();
                if (project.paidUntil && new Date(project.paidUntil) > startDate) {
                    startDate = new Date(project.paidUntil);
                }
                
                // Add months
                const monthsToAdd = invoice.periodMonths || 1;
                const newPaidUntil = new Date(startDate);
                newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsToAdd);
                
                project.paidUntil = newPaidUntil;
                await project.save();
                console.log(`Project ${project.id} subscription extended by ${monthsToAdd} months until ${newPaidUntil}`);
                
                // Restart PM2 process
                await startPM2Process(project);
            }
        }

        if (invoice.type === 'monthly' && invoice.gameServerId) {
            const server = await GameServer.findByPk(invoice.gameServerId, { include: [{ model: ServerNode, as: 'node' }] });
            if (server) {
                let startDate = new Date();
                const currentPaidUntil = server.paidUntil ? new Date(server.paidUntil) : null;
                if (currentPaidUntil && currentPaidUntil > startDate) {
                    startDate = currentPaidUntil;
                }

                const monthsToAdd = invoice.periodMonths || 1;
                const newPaidUntil = new Date(startDate);
                newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsToAdd);

                const needsProvision = !server.containerId || !server.port;
                const node = (server as unknown as { node?: ServerNode }).node;

                if (needsProvision) {
                    if (!node) {
                        console.error('GameServer has no node loaded for provisioning');
                    } else if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
                        const basePortByGame: Record<string, number> = { minecraft: 25565, cs2: 27015, cs16: 27015 };
                        const basePort = basePortByGame[server.game] || 25565;
                        const last = await GameServer.findOne({ where: { nodeId: server.nodeId }, order: [['port', 'DESC']] });
                        const port = !last || !last.port || last.port < basePort ? basePort : last.port + 1;
                        await server.update({
                            port,
                            containerId: 'mock_' + Math.random().toString(36).substring(7),
                            status: 'running',
                            paidUntil: newPaidUntil
                        });
                    } else {
                        const basePortByGame: Record<string, number> = { minecraft: 25565, cs2: 27015, cs16: 27015 };
                        const basePort = basePortByGame[server.game] || 25565;
                        const last = await GameServer.findOne({ where: { nodeId: server.nodeId }, order: [['port', 'DESC']] });
                        const port = !last || !last.port || last.port < basePort ? basePort : last.port + 1;
                        const containerName = `gs_${server.userId.split('-')[0]}_${port}`;

                        const dockerCmd =
                            server.game === 'minecraft'
                                ? `docker run -d -p ${port}:25565 -e EULA=TRUE -e MAX_PLAYERS=${server.slots || 20} --name ${containerName} -m ${server.ram || 1024}m itzg/minecraft-server`
                                : server.game === 'cs2'
                                  ? `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} -e SRCDS_TOKEN=YOUR_TOKEN joedwards32/cs2 +maxplayers ${server.slots || 32}`
                                  : `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} archont94/counter-strike1.6:latest +map de_dust2 +maxplayers ${server.slots || 32}`;

                        const config = {
                            host: node.ip,
                            port: node.sshPort,
                            username: node.sshUser,
                            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
                        };

                        const output = await execCommand(config, dockerCmd);
                        const containerId = output.trim().substring(0, 12);
                        await server.update({ port, containerId, status: 'running', paidUntil: newPaidUntil });
                    }
                } else {
                    await server.update({ paidUntil: newPaidUntil });
                }
                console.log(`GameServer ${server.id} subscription extended by ${monthsToAdd} months until ${newPaidUntil}`);

                if (node && node.ip !== '127.0.0.1' && node.ip !== '1.1.1.1') {
                    const config = {
                        host: node.ip,
                        port: node.sshPort,
                        username: node.sshUser,
                        password: node.sshPassword ? decrypt(node.sshPassword) : undefined
                    };
                    const ident = server.containerId || `gs_${server.userId.split('-')[0]}_${server.port}`;
                    await execCommand(config, `sh -lc "docker start ${ident} >/dev/null 2>&1 || true"`);
                    await server.update({ status: 'running' });
                }
            }
        }
      } else if (invoice) {
        console.log(`Invoice ${invoiceId} is already paid`);
      } else {
        console.log(`Invoice ${invoiceId} not found`);
      }
    } else {
      console.log(`Webhook ignored: status=${currentStatus}, invoiceId=${invoiceId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
});

export default router;
