import { Request, Response } from 'express';
import { ServerNode } from '../models';
import { encrypt, decrypt } from '../utils/crypto';
import { execCommand } from '../services/sshService';

const installDocker = async (node: any) => {
    try {
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: decrypt(node.sshPassword)
        };
        
        // Check if docker exists
        try {
            await execCommand(config, 'docker -v');
            console.log(`Docker already installed on ${node.name}`);
        } catch (e) {
            console.log(`Installing Docker on ${node.name}...`);
            // Standard Docker install script
            await execCommand(config, 'curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh');
        }
    } catch (error) {
        console.error(`Failed to check/install Docker on ${node.name}:`, error);
        throw error;
    }
};

export const createNode = async (req: Request, res: Response) => {
    try {
        const { name, ip, sshPort, sshUser, sshPassword, totalRam } = req.body;
        
        const node = await ServerNode.create({
            name,
            ip,
            sshPort: sshPort || 22,
            sshUser: sshUser || 'root',
            sshPassword: sshPassword ? encrypt(sshPassword) : null,
            totalRam: totalRam || 0
        });

        // Try to install Docker (async)
        installDocker(node).catch(err => console.error('Docker install failed background:', err));

        res.status(201).json(node);
    } catch (error) {
        console.error('Create node error:', error);
        res.status(500).json({ message: 'Error creating node' });
    }
};

export const getNodes = async (req: Request, res: Response) => {
    try {
        const nodes = await ServerNode.findAll();
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching nodes' });
    }
};

export const deleteNode = async (req: Request, res: Response) => {
    try {
        await ServerNode.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Node deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting node' });
    }
};
