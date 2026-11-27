import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import Document from './models/Document.js';

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-session-id'],
  })
);
app.use(express.json({ limit: '1mb' }));

// 2. Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 AI analyses per IP every 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit reached (10 analyses per 15 minutes). Please wait a bit.' },
});

app.use('/api/', apiLimiter);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  },
});

const MODE_INSTRUCTIONS = {
  summarize:
    'Provide a clear, concise executive summary and highlight the most important takeaways.',
  extract:
    'Focus heavily on extracting key entities (names, organizations, dates, monetary values, obligations, IDs) into the entities array, alongside a brief overview.',
  bullets:
    'Convert the document into crisp, actionable bullet points in keyPoints with a brief executive summary.',
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
  });
});

const getSessionId = (req) => req.headers['x-session-id']?.trim();

// Get recent analyzed documents
app.get('/api/documents', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.json([]);
    const docs = await Document.find({ sessionId }).sort({ createdAt: -1 }).limit(20);
    res.json(docs);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to load document history.' });
  }
});

// Analyze PDF and save to MongoDB (Protected by strict rate limiter)
app.post('/api/analyze', analyzeLimiter, upload.single('file'), async (req, res) => {
  console.log('\n[1] Request received:', req.file?.originalname, '| mode:', req.body.mode);

  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID.' });

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in server/.env' });
    }

    const mode = Object.keys(MODE_INSTRUCTIONS).includes(req.body.mode)
      ? req.body.mode
      : 'summarize';
    const modeInstruction = MODE_INSTRUCTIONS[mode];

    // 1. Extract text from PDF
    console.log('[2] Extracting text from PDF...');
    const parser = new PDFParse({ data: req.file.buffer });
    let extractedText = '';
    try {
      const pdfData = await parser.getText();
      extractedText = pdfData.text?.trim() || '';
    } finally {
      await parser.destroy();
    }

    if (!extractedText) {
      return res.status(400).json({
        error: 'No readable text found in this PDF (it may be a scanned image).',
      });
    }

    console.log('[3] Extracted', extractedText.length, 'characters. Calling Gemini...');

    // 2. Call Gemini API with automatic retry + fallback on 503
    const prompt = `You are DocuSense AI, an expert document analyst.
Task: ${modeInstruction}

Return ONLY a valid JSON object matching this exact structure:
{
  "title": "Short inferred title of the document",
  "summary": "2-4 sentence executive summary",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "entities": [
    { "label": "Entity category (e.g., Party, Date, Amount, Location)", "value": "Extracted value" }
  ]
}

Document text:
"""
${extractedText.slice(0, 30000)}
"""`;

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let response;
    let lastError;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });
          break;
        } catch (err) {
          lastError = err;
          if (err.status === 503) {
            console.log(`[3b] ${modelName} busy (attempt ${attempt}), retrying...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else {
            throw err;
          }
        }
      }
      if (response) break;
    }

    if (!response) throw lastError;

    const parsedResult = JSON.parse(response.text);

    // 3. Save to MongoDB
    const savedDoc = await Document.create({
      sessionId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mode,
      result: parsedResult,
    });

    console.log('[4] Saved to MongoDB with ID:', savedDoc._id);
    res.status(201).json(savedDoc);
  } catch (error) {
    console.error('[ERROR]:', error);
    const message =
      error.status === 503
        ? 'The AI service is temporarily busy. Please wait a few seconds and try again.'
        : error.status === 429
          ? 'API quota limit reached. Please try again in a minute.'
          : 'Failed to analyze document. Please try again.';

    res.status(error.status || 500).json({ error: message });
  }
});

// Delete a single document (with ObjectId validation)
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID.' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }
    const deleted = await Document.findOneAndDelete({ _id: req.params.id, sessionId });
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    res.json({ message: 'Document deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// Clear all documents
app.delete('/api/documents', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID.' });
    await Document.deleteMany({ sessionId });
    res.json({ message: 'All documents cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear documents.' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only PDF files are allowed.') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Connect to MongoDB first, then start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, (err) => {
      if (err) {
        console.error('Failed to start server:', err.message);
        return;
      }
      console.log(`DocuSense server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
