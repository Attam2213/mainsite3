
import { Request, Response, NextFunction } from 'express';
import { Server } from '../models';

export interface AgentRequest extends Request {
  serverAgent?: Server;
}

export const authenticateAgent = async (req: AgentRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['x-agent-token'] || req.body.token;

    if (!token) {
      return res.status(401).json({ message: 'Agent token required' });
    }

    const server = await Server.findOne({ where: { token } });

    if (!server) {
      return res.status(403).json({ message: 'Invalid agent token' });
    }

    req.serverAgent = server;
    next();
  } catch (error) {
    console.error('Agent authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
