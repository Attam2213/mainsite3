import { Request, Response } from 'express';
import { GameServer, ServerNode } from '../models';
import { decrypt } from '../utils/crypto';
import { execCommand } from '../services/sshService';

const GAME_PORTS: Record<string, number> = {
    'minecraft': 25565,
    'cs2': 27015
};

const GAME_IMAGES: Record<string, string> = {
    'minecraft': 'itzg/minecraft-server',
    'cs2': 'joedwards32/cs2'
};

const findFreePort = async (nodeId: string, startPort: number) => {
    const lastServer = await GameServer.findOne({
        where: { nodeId },
        order: [['port', 'DESC']]
    });
    
    if (!lastServer) return startPort;
    // If last server port is less than startPort (e.g. different game), start from startPort
    if (lastServer.port < startPort) return startPort;
    
    return lastServer.port + 1;
};

export const createGameServer = async (req: Request, res: Response) => {
    try {
        const { userId, nodeId, game, name, ram } = req.body;
        
        const node = await ServerNode.findByPk(nodeId);
        if (!node) {
            res.status(404).json({ message: 'Node not found' });
            return;
        }

        const basePort = GAME_PORTS[game];
        if (!basePort) {
            res.status(400).json({ message: 'Unsupported game' });
            return;
        }

        const port = await findFreePort(nodeId, basePort);
        const containerName = `gs_${userId.split('-')[0]}_${port}`;
        
        // Command construction
        let dockerCmd = '';
        if (game === 'minecraft') {
            dockerCmd = `docker run -d -p ${port}:25565 -e EULA=TRUE --name ${containerName} -m ${ram || 1024}m ${GAME_IMAGES['minecraft']}`;
        } else if (game === 'cs2') {
            // CS2 needs UDP and TCP
            dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} -e SRCDS_TOKEN=YOUR_TOKEN ${GAME_IMAGES['cs2']}`;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        // Execute creation
        console.log(`Creating container ${containerName} on ${node.ip}...`);
        const output = await execCommand(config, dockerCmd);
        const containerId = output.trim().substring(0, 12); // Short ID

        const server = await GameServer.create({
            userId,
            nodeId,
            game,
            name,
            port,
            ram: ram || 1024,
            status: 'running',
            containerId
        });

        res.status(201).json(server);

    } catch (error) {
        console.error('Create game server error:', error);
        res.status(500).json({ message: 'Error creating game server' });
    }
};

export const getGameServers = async (req: Request, res: Response) => {
    try {
        const servers = await GameServer.findAll({ include: ['node'] });
        res.json(servers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching servers' });
    }
};

export const controlServer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // start, stop, restart
        
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        
        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        let cmd = '';
        if (action === 'start') cmd = `docker start ${server.containerId}`;
        if (action === 'stop') cmd = `docker stop ${server.containerId}`;
        if (action === 'restart') cmd = `docker restart ${server.containerId}`;

        if (cmd) {
            await execCommand(config, cmd);
            
            // Update status
            if (action === 'start') await server.update({ status: 'running' });
            if (action === 'stop') await server.update({ status: 'stopped' });
            if (action === 'restart') await server.update({ status: 'running' });
        }

        res.json({ message: `Server ${action}ed` });
    } catch (error) {
        console.error('Control error:', error);
        res.status(500).json({ message: 'Error controlling server' });
    }
};

export const orderGameServer = async (req: Request, res: Response) => {
    try {
        const { nodeId, game, name, ram } = req.body;
        // @ts-ignore
        const userId = req.user.id;
        
        const node = await ServerNode.findByPk(nodeId);
        if (!node) {
            res.status(404).json({ message: 'Node not found' });
            return;
        }

        const basePort = GAME_PORTS[game];
        if (!basePort) {
            res.status(400).json({ message: 'Unsupported game' });
            return;
        }

        const port = await findFreePort(nodeId, basePort);
        const containerName = `gs_${userId.split('-')[0]}_${port}`;
        
        let dockerCmd = '';
        if (game === 'minecraft') {
            dockerCmd = `docker run -d -p ${port}:25565 -e EULA=TRUE --name ${containerName} -m ${ram || 1024}m ${GAME_IMAGES['minecraft']}`;
        } else if (game === 'cs2') {
            dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} -e SRCDS_TOKEN=YOUR_TOKEN ${GAME_IMAGES['cs2']}`;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        console.log(`Creating container ${containerName} on ${node.ip}...`);
        const output = await execCommand(config, dockerCmd);
        const containerId = output.trim().substring(0, 12);

        const server = await GameServer.create({
            userId,
            nodeId,
            game,
            name,
            port,
            ram: ram || 1024,
            status: 'running',
            containerId
        });

        res.status(201).json(server);

    } catch (error) {
        console.error('Order game server error:', error);
        res.status(500).json({ message: 'Error ordering game server' });
    }
};
