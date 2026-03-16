import { Request, Response } from 'express';
import { ServerNode } from '../models';
import { encrypt, decrypt } from '../utils/crypto';
import { execCommand } from '../services/sshService';

const normalizeSupportedGames = (value: any) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return null;
};

const normalizeSlotPrices = (value: any) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, number>;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, number>;
        } catch {
            return null;
        }
    }
    return null;
};

const getIdParam = (req: Request) => {
    const raw = (req.params as any).id;
    if (Array.isArray(raw)) return raw[0];
    return raw as string;
};

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
        const { name, ip, sshPort, sshUser, sshPassword, totalRam, supportedGames, slotPrice, slotPrices } = req.body;
        
        const node = await ServerNode.create({
            name,
            ip,
            sshPort: sshPort || 22,
            sshUser: sshUser || 'root',
            sshPassword: sshPassword ? encrypt(sshPassword) : null,
            totalRam: totalRam || 0,
            supportedGames: Array.isArray(supportedGames) ? supportedGames : undefined,
            slotPrice: Number.isFinite(Number(slotPrice)) ? Number(slotPrice) : undefined,
            slotPrices: normalizeSlotPrices(slotPrices) || undefined
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
        res.json(nodes.map(n => {
            const data: any = n.toJSON();
            const normalized = normalizeSupportedGames(data.supportedGames);
            if (normalized) data.supportedGames = normalized;
            const slotPricesNorm = normalizeSlotPrices(data.slotPrices);
            if (slotPricesNorm) data.slotPrices = slotPricesNorm;
            return data;
        }));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching nodes' });
    }
};

export const getPublicNodes = async (req: Request, res: Response) => {
    try {
        const nodes = await ServerNode.findAll({
            attributes: ['id', 'name', 'ip', 'totalRam', 'status', 'supportedGames', 'slotPrice', 'slotPrices']
        });
        console.log('Returning public nodes:', nodes.length);
        res.json(nodes.map(n => {
            const data: any = n.toJSON();
            const normalized = normalizeSupportedGames(data.supportedGames);
            data.supportedGames = normalized || [];
            const slotPricesNorm = normalizeSlotPrices(data.slotPrices);
            data.slotPrices = slotPricesNorm || {};
            return data;
        }));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching nodes' });
    }
};

export const updateNode = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const node = await ServerNode.findByPk(id);
        if (!node) {
            res.status(404).json({ message: 'Node not found' });
            return;
        }

        const { name, ip, sshPort, sshUser, sshPassword, totalRam, status, supportedGames, slotPrice, slotPrices } = req.body;
        const normalizedSlotPrices = normalizeSlotPrices(slotPrices);

        await node.update({
            name: name ?? node.name,
            ip: ip ?? node.ip,
            sshPort: sshPort ?? node.sshPort,
            sshUser: sshUser ?? node.sshUser,
            sshPassword: sshPassword ? encrypt(sshPassword) : node.sshPassword,
            totalRam: totalRam ?? node.totalRam,
            status: status ?? node.status,
            supportedGames: Array.isArray(supportedGames) ? supportedGames : node.supportedGames,
            slotPrice: Number.isFinite(Number(slotPrice)) ? Number(slotPrice) : node.slotPrice,
            slotPrices: normalizedSlotPrices ? normalizedSlotPrices : node.slotPrices
        });

        res.json(node);
    } catch (error) {
        console.error('Update node error:', error);
        res.status(500).json({ message: 'Error updating node' });
    }
};

export const deleteNode = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        await ServerNode.destroy({ where: { id } });
        res.json({ message: 'Node deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting node' });
    }
};
