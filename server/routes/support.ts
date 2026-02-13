import express from 'express';
import { Ticket, Message, User } from '../models/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get tickets (filtered by user role)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    let where = {};
    if (user.role !== 'admin') {
      where = { userId: user.id };
    }
    
    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { 
          model: Message, 
          as: 'messages', 
          include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }] 
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create ticket
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { subject, initialMessage } = req.body;
    
    const ticket = await Ticket.create({
      userId: req.user.id,
      subject,
      status: 'open',
      lastMessageAt: new Date()
    });
    
    // Create initial message
    await Message.create({
      ticketId: ticket.id,
      senderId: req.user.id,
      text: initialMessage,
      isAdmin: req.user.role === 'admin'
    });
    
    // Reload ticket with messages
    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { 
          model: Message, 
          as: 'messages', 
          include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }] 
        }
      ]
    });
    
    res.json(fullTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Add message to ticket
router.post('/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const ticketId = req.params.id;
    
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    // Check access
    if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const message = await Message.create({
      ticketId,
      senderId: req.user.id,
      text,
      isAdmin: req.user.role === 'admin'
    });
    
    // Update ticket lastMessageAt
    await ticket.update({ lastMessageAt: new Date() });
    
    // Reload message with sender
    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }]
    });
    
    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Close ticket
router.put('/:id/close', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    await ticket.update({ status: 'closed' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
