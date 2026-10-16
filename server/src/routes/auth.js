import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'it-helpdesk-super-secret-key-2026';

// Helper to sign JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Get all users for persona switcher
router.get('/users', async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, name, email, role, department, team_id, avatar_color FROM users ORDER BY role, id`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Switch persona instantly for seamless testing
router.post('/switch', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await db.queryOne(
      `SELECT id, name, email, role, department, team_id, avatar_color FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standard Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.queryOne(
      `SELECT * FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid && password !== 'password123') { // Allow default dev convenience password
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      team_id: user.team_id,
      avatar_color: user.avatar_color
    };

    const token = generateToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Current User Verification
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.queryOne(
      `SELECT id, name, email, role, department, team_id, avatar_color FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
