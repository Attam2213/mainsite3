import express from 'express';
import { createGameServer, getGameServers, controlServer, orderGameServer, getConsoleLogs, sendCommand, getServerSettings, updateServerSettings, getGameServerFiles, getGameServerFileContent, saveGameServerFileContent, deleteGameServerFile, uploadGameServerFileStream, deleteGameServer, getPlayersCount, getSftpAccess, enableSftpAccess, disableSftpAccess, createGameServerSubscriptionInvoice } from '../controllers/gameServerController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Admin creates server (or via payment logic)
router.post('/', authenticateToken, isAdmin, createGameServer);
router.post('/order', authenticateToken, orderGameServer);
router.get('/', authenticateToken, getGameServers);
router.get('/:id/logs', authenticateToken, getConsoleLogs);
router.get('/:id/players', authenticateToken, getPlayersCount);
router.get('/:id/sftp', authenticateToken, getSftpAccess);
router.post('/:id/sftp/enable', authenticateToken, enableSftpAccess);
router.post('/:id/sftp/disable', authenticateToken, disableSftpAccess);
router.post('/:id/subscription', authenticateToken, createGameServerSubscriptionInvoice);
router.post('/:id/command', authenticateToken, sendCommand);
router.post('/:id/control', authenticateToken, controlServer);
router.get('/:id/settings', authenticateToken, getServerSettings);
router.post('/:id/settings', authenticateToken, updateServerSettings);
router.get('/:id/files', authenticateToken, getGameServerFiles);
router.get('/:id/files/content', authenticateToken, getGameServerFileContent);
router.post('/:id/files/content', authenticateToken, saveGameServerFileContent);
router.delete('/:id/files', authenticateToken, deleteGameServerFile);
router.post('/:id/files/upload', authenticateToken, uploadGameServerFileStream);
router.delete('/:id', authenticateToken, deleteGameServer);

export default router;
