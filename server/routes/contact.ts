import express from 'express';
import { Setting } from '../models/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Get Telegram config
    const setting = await Setting.findOne({ where: { key: 'telegram_config' } });
    if (!setting || !setting.value) {
      // Config not found, but we shouldn't fail the request if it's just not set up
      // Or maybe we should log it.
      // If the frontend thinks it's enabled, it might expect success.
      // But if it's not configured on backend, we just ignore.
      return res.json({ message: 'Message received (Telegram not configured)' });
    }

    const config = setting.value as any;
    
    if (config.isEnabled && config.botToken && config.chatId) {
      const text = `
📩 *Новая заявка с сайта*

👤 *Имя:* ${name}
📧 *Email:* ${email}
📝 *Тема:* ${subject}

💬 *Сообщение:*
${message}
      `;

      try {
        const telegramRes = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: text,
            parse_mode: 'Markdown',
          }),
        });

        const data = await telegramRes.json();
        if (!data.ok) {
          console.error('Telegram API error:', data);
          // Don't fail the user request, but log error
        }
      } catch (tgError) {
        console.error('Failed to send to Telegram:', tgError);
      }
    }

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
