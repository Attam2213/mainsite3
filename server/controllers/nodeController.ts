import { Request, Response } from 'express';
import { ServerNode } from '../models';
import { encrypt, decrypt } from '../utils/crypto';
import { execCommand } from '../services/sshService';

let publicNodesCache: any = null;
let publicNodesCacheTime = 0;
const PUBLIC_NODES_CACHE_TTL = 60 * 1000;

const FAKE_IP_BLACKLIST = new Set([
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '1.1.1.1',
  '255.255.255.255',
  'localhost',
]);
const isRealNodeIp = (ip: unknown): boolean => {
  if (!ip || typeof ip !== 'string') return false;
  const normalized = ip.trim().toLowerCase();
  if (FAKE_IP_BLACKLIST.has(normalized)) return false;
  if (normalized.startsWith('127.')) return false;
  if (normalized.startsWith('192.168.')) return false;
  if (normalized.startsWith('10.')) return false;
  if (normalized.startsWith('172.')) {
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      const secondOct = Number(parts[1]);
      if (!Number.isNaN(secondOct) && secondOct >= 16 && secondOct <= 31) return false;
    }
  }
  return /^[0-9a-f:.]+$/i.test(normalized);
};

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
        const { name, ip, sshPort, sshUser, sshPassword, totalRam, supportedGames, slotPrice, slotPrices, type, capacityWebSites, usedWebSites, webSftpPortStart, webSftpPortEnd } = req.body;
        const validType = (type === 'game' || type === 'web' || type === 'both') ? type : 'game';
        
        const node = await ServerNode.create({
            name,
            ip,
            sshPort: sshPort || 22,
            sshUser: sshUser || 'root',
            sshPassword: sshPassword ? encrypt(sshPassword) : null,
            totalRam: totalRam || 0,
            supportedGames: Array.isArray(supportedGames) ? supportedGames : undefined,
            slotPrice: Number.isFinite(Number(slotPrice)) ? Number(slotPrice) : undefined,
            slotPrices: normalizeSlotPrices(slotPrices) || undefined,
            type: validType,
            capacityWebSites: Number.isFinite(Number(capacityWebSites)) ? Number(capacityWebSites) : 50,
            usedWebSites: Number.isFinite(Number(usedWebSites)) ? Number(usedWebSites) : 0,
            webSftpPortStart: Number.isFinite(Number(webSftpPortStart)) ? Number(webSftpPortStart) : 2222,
            webSftpPortEnd: Number.isFinite(Number(webSftpPortEnd)) ? Number(webSftpPortEnd) : 2299,
        } as any);

        // Try to install Docker (async)
        installDocker(node).catch(err => console.error('Docker install failed background:', err));

        res.status(201).json(node);
    } catch (error) {
        console.error('Create node error:', error);
        res.status(500).json({ message: 'Error creating node', detail: error instanceof Error ? error.message : String(error) });
    }
};

export const getNodes = async (req: Request, res: Response) => {
    try {
        const nodes = await ServerNode.findAll();
        const filtered = nodes.filter(n => {
            const data: any = n.toJSON();
            return isRealNodeIp(data.ip);
        });
        res.json(filtered.map(n => {
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
        const now = Date.now();
        if (publicNodesCache && now - publicNodesCacheTime < PUBLIC_NODES_CACHE_TTL) {
            return res.json(publicNodesCache);
        }
        const nodes = await ServerNode.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'ip', 'totalRam', 'status', 'supportedGames', 'slotPrice', 'slotPrices']
        });
        const result = nodes
            .filter(n => isRealNodeIp((n as any).ip))
            .map(n => {
                const data: any = n.toJSON();
                const normalized = normalizeSupportedGames(data.supportedGames);
                data.supportedGames = normalized || [];
                const slotPricesNorm = normalizeSlotPrices(data.slotPrices);
                data.slotPrices = slotPricesNorm || {};
                delete data.sshPassword;
                delete data.sshUser;
                delete data.sshPort;
                return data;
            });
        publicNodesCache = result;
        publicNodesCacheTime = now;
        res.json(result);
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

        const { name, ip, sshPort, sshUser, sshPassword, totalRam, status, supportedGames, slotPrice, slotPrices, type, capacityWebSites, usedWebSites, webSftpPortStart, webSftpPortEnd } = req.body;
        const normalizedSlotPrices = normalizeSlotPrices(slotPrices);
        const validType = (type === 'game' || type === 'web' || type === 'both') ? type : (node as any).type || 'game';

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
            slotPrices: normalizedSlotPrices ? normalizedSlotPrices : node.slotPrices,
            type: validType,
            capacityWebSites: Number.isFinite(Number(capacityWebSites)) ? Number(capacityWebSites) : (node as any).capacityWebSites,
            usedWebSites: Number.isFinite(Number(usedWebSites)) ? Number(usedWebSites) : (node as any).usedWebSites,
            webSftpPortStart: Number.isFinite(Number(webSftpPortStart)) ? Number(webSftpPortStart) : (node as any).webSftpPortStart,
            webSftpPortEnd: Number.isFinite(Number(webSftpPortEnd)) ? Number(webSftpPortEnd) : (node as any).webSftpPortEnd,
        } as any);

        res.json(node);
    } catch (error) {
        console.error('Update node error:', error);
        res.status(500).json({ message: 'Error updating node', detail: error instanceof Error ? error.message : String(error) });
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
