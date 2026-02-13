import express from 'express';
import { Project, Comment, Attachment, User } from '../models/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all projects (filtered by user role)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    let where = {};
    if (user.role !== 'admin') {
      where = { clientId: user.id };
    }
    
    const projects = await Project.findAll({
      where,
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }] },
        { model: Attachment, as: 'attachments' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create project (Admin only or Client?)
// Typically Admin creates project for Client.
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only admin can create projects for others
    // Client could request a project, but usually it's admin managed.
    // Assuming admin for now or client creating for themselves?
    // User input implies admin manages projects.
    
    const project = await Project.create(req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    await project.update(req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.create({
      projectId: req.params.id,
      authorId: req.user.id,
      text
    });
    
    // Reload to get author info
    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }]
    });
    
    res.json(fullComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Add attachment
router.post('/:id/attachments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const attachment = await Attachment.create({
      projectId: req.params.id,
      ...req.body
    });
    res.json(attachment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    
    await attachment.destroy();
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
