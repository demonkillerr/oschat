import express from 'express';
import passport from 'passport';
import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.WEB_ORIGIN || 'http://localhost:3000'}/login?error=auth_failed` 
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.WEB_ORIGIN || 'http://localhost:3000'}/auth/callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[auth] Error in Google callback:', error);
      res.redirect(`${process.env.WEB_ORIGIN || 'http://localhost:3000'}/login?error=server_error`);
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { verifyToken } = await import('../middleware/auth.js');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[auth] Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { verifyToken } = await import('../middleware/auth.js');
      const decoded = verifyToken(token);
      
      if (decoded) {
        await User.findByIdAndUpdate(decoded.userId, { 
          status: 'offline',
          socketId: null,
          lastSeen: new Date()
        });
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[auth] Error during logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
