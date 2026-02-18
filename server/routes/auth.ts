import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'wexa-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'client'
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    let user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    let passwordHash = user.password as unknown as string | null;

    if (!passwordHash) {
      const defaultPassword = 'admin';
      passwordHash = await bcrypt.hash(defaultPassword, 10);
      await user.update({ password: passwordHash });
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      console.log('Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.email === 'admin@wexa.dev' && user.role !== 'admin') {
      user = await user.update({ role: 'admin' });
    }

    const payload = { id: user.id, role: user.role } as { id: string; role: 'admin' | 'client' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    const plain: any = (user as any)?.toJSON ? (user as any).toJSON() : user;
    const safeUser = {
      id: plain?.id,
      name: plain?.name,
      email: plain?.email,
      role: plain?.role,
      avatar: plain?.avatar
    };
    console.log('Login successful:', { email, role: safeUser.role, id: safeUser.id });

    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

// Get Current User
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Debug endpoint to inspect current build and token payload
router.get('/debug', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let decoded: any = null;
    if (token) {
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        decoded = { error: 'invalid token' };
      }
    }
    res.json({
      build: '2026-02-18Tdebug-01',
      decoded
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

// Get All Users (Admin only usually, but open for now for simple migration)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update User
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, avatar } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ name, email, role, avatar });
    
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete User
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
