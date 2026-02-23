import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wexa-secret-key';

export type UserRole = 'admin' | 'client';
export interface TokenPayload { id: string; role: UserRole; iat?: number; exp?: number }
export interface AuthRequest extends Request { user: TokenPayload }

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    return res.sendStatus(403);
  }
};
