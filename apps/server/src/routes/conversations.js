import express from 'express';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
      .populate('participants', 'name email avatar status lastSeen')
      .populate('lastMessage')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name avatar'
        }
      })
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('[conversations] Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, participantIds, name } = req.body;

    if (!type || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'Invalid request. Type and participantIds required.' });
    }

    // Add current user to participants if not included
    const allParticipants = [...new Set([req.userId.toString(), ...participantIds])];

    // For direct chats, check if conversation already exists
    if (type === 'direct') {
      if (allParticipants.length !== 2) {
        return res.status(400).json({ error: 'Direct chat must have exactly 2 participants' });
      }

      const existing = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: 2 }
      })
        .populate('participants', 'name email avatar status lastSeen')
        .populate('lastMessage');

      if (existing) {
        return res.json({ conversation: existing });
      }
    }

    // Create new conversation
    const conversation = await Conversation.create({
      type,
      participants: allParticipants,
      name: type === 'group' ? name : null,
      admin: type === 'group' ? [req.userId] : []
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar status lastSeen')
      .populate('lastMessage');

    res.status(201).json({ conversation: populated });
  } catch (error) {
    console.error('[conversations] Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get a specific conversation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.userId
    })
      .populate('participants', 'name email avatar status lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('[conversations] Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get messages for a conversation
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const query = { 
      conversation: req.params.id,
      deleted: false
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('[conversations] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Update conversation (name, avatar, etc.)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is admin for group chats
    if (conversation.type === 'group' && !conversation.admin.includes(req.userId)) {
      return res.status(403).json({ error: 'Only admins can update group conversations' });
    }

    if (name !== undefined) conversation.name = name;
    if (avatar !== undefined) conversation.avatar = avatar;

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar status lastSeen');

    res.json({ conversation: updated });
  } catch (error) {
    console.error('[conversations] Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Add participants to group conversation
router.post('/:id/participants', authenticateToken, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.userId,
      type: 'group'
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group conversation not found' });
    }

    if (!conversation.admin.includes(req.userId)) {
      return res.status(403).json({ error: 'Only admins can add participants' });
    }

    // Add new participants
    const newParticipants = userIds.filter(id => !conversation.participants.includes(id));
    conversation.participants.push(...newParticipants);
    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar status lastSeen');

    res.json({ conversation: updated });
  } catch (error) {
    console.error('[conversations] Error adding participants:', error);
    res.status(500).json({ error: 'Failed to add participants' });
  }
});

export default router;
