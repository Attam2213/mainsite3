import express from 'express';
import { Setting } from '../models/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'wexa-secret-key';

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const formattedSettings: any = {};
    
    // Try to get user from token
    let user: any = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // Invalid token, treat as guest
      }
    }

    settings.forEach(s => {
      let val = s.value;
      // If not admin, sanitize sensitive config
      if ((!user || user.role !== 'admin') && s.key === 'telegram_config') {
        const conf = val as any;
        val = {
          ...conf,
          botToken: undefined, // Hide token
          chatId: undefined    // Hide chat ID
        };
      }
      formattedSettings[s.key] = val;
    });

    res.json(formattedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update settings (Admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { key, value } = req.body;
    
    // Upsert
    const [setting, created] = await Setting.findOrCreate({
      where: { key },
      defaults: { value }
    });
    
    if (!created) {
      await setting.update({ value });
    }
    
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
