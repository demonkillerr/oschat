import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      _id: { $ne: req.userId }, // Exclude current user
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email avatar status lastSeen')
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('[users] Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email avatar status lastSeen createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[users] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update current user profile
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('name email avatar status lastSeen');

    res.json({ user });
  } catch (error) {
    console.error('[users] Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
