import { Router } from 'express';
import { Message } from '../models/Message.js';

const router = Router();

// GET /api/messages?limit=50
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const docs = await Message.find({}).sort({ ts: -1 }).limit(limit).lean();
    res.json(docs.reverse());
  } catch (err) {
    res.status(500).json({ error: 'failed_to_fetch_messages' });
  }
});

export default router;

