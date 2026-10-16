import express from 'express';
import { categorizeTicket } from '../services/aiClassifier.js';

const router = express.Router();

/**
 * Real-time AI classification and solution suggestions
 * Used while user is typing or on-demand
 */
router.post('/classify', async (req, res) => {
  try {
    const { title = '', description = '' } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({ error: 'Title or description is required for AI classification' });
    }

    const aiResult = categorizeTicket(title, description);

    // Optional: If GEMINI_API_KEY is available, we can enhance the reasoning
    if (process.env.GEMINI_API_KEY) {
      try {
        // Can call Google Gemini API if user configured key
        // We provide full offline AI classifier by default
      } catch (geminiErr) {
        console.warn('[AI] Gemini API error, falling back to local NLP classifier:', geminiErr.message);
      }
    }

    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
