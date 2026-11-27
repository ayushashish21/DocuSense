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
app.set('trust proxy', 1);
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
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit reached (10 analyses per 15 minutes). Please wait a bit.' },
});

const askLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Follow-up limit reached (30 questions per 15 minutes). Please wait a bit.' },
});

app.use('/api/', apiLimiter);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = file.originalname?.toLowerCase().endsWith('.pdf');
    if (isPdfMime || isPdfExt) {
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
  email:
    'Draft a professional, ready-to-send follow-up or executive update email based on the document. Put the full email body (including greeting and sign-off) in summary, put the suggested Subject line and next steps in keyPoints, and extract recipients, dates, or action owners in entities.',
  custom: 'Answer the user request based on the document.',
};

const getSessionId = (req) => req.headers['x-session-id']?.trim();

const generateWithRetry = async (contents, config = {}) => {
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  let response;
  let lastError;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });
        break;
      } catch (err) {
        lastError = err;
        if (err.status === 503) {
          console.log(`[AI] ${modelName} busy (attempt ${attempt}), retrying...`);
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          throw err;
        }
      }
    }
    if (response) break;
  }

  if (!response) throw lastError;
  return response;
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Get recent analyzed documents for this session
app.get('/api/documents', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.json([]);
    const docs = await Document.find({ sessionId })
      .select('-extractedText')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(docs);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to load document history.' });
  }
});

// Analyze PDF (with automatic OCR fallback for scanned PDFs)
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
    const customPrompt = req.body.customPrompt?.trim().slice(0, 500) || '';
    if (mode === 'custom' && !customPrompt) {
      return res.status(400).json({ error: 'Please enter a custom prompt or question.' });
    }

    const modeInstruction =
      mode === 'custom'
        ? `Fulfill this specific user request based strictly on the document: "${customPrompt}". Put the main answer in summary, supporting points in keyPoints, and relevant facts in entities.`
        : MODE_INSTRUCTIONS[mode];

    // 1. Attempt text extraction with pdf-parse
    let extractedText = '';
    let ocrUsed = false;
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        const pdfData = await parser.getText();
        extractedText = pdfData.text?.trim() || '';
      } finally {
        await parser.destroy();
      }
    } catch (parseErr) {
      console.log('[2] pdf-parse failed, falling back to Gemini PDF OCR:', parseErr.message);
    }

    if (extractedText.length < 30) {
      ocrUsed = true;
      console.log('[2] Low/no selectable text detected. Using Gemini native PDF OCR...');
    } else {
      console.log('[2] Extracted', extractedText.length, 'characters.');
    }

    // 2. Build prompt and call Gemini
    const baseSchema = ocrUsed
      ? `{
  "title": "Short inferred title of the document",
  "summary": "2-4 sentence executive summary",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "entities": [
    { "label": "Entity category (e.g., Party, Date, Amount, Location)", "value": "Extracted value" }
  ],
  "extractedText": "Clean plain-text transcription of the main readable text in the document (max 15000 characters)"
}`
      : `{
  "title": "Short inferred title of the document",
  "summary": "2-4 sentence executive summary",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "entities": [
    { "label": "Entity category (e.g., Party, Date, Amount, Location)", "value": "Extracted value" }
  ]
}`;

    const prompt = ocrUsed
      ? `You are DocuSense AI, an expert document analyst with OCR capabilities.
Read the attached PDF carefully (including scanned pages, tables, or images).
Task: ${modeInstruction}

Return ONLY a valid JSON object matching this exact structure:
${baseSchema}`
      : `You are DocuSense AI, an expert document analyst.
Task: ${modeInstruction}

Return ONLY a valid JSON object matching this exact structure:
${baseSchema}

Document text:
"""
${extractedText.slice(0, 30000)}
"""`;

    const contents = ocrUsed
      ? [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: req.file.buffer.toString('base64'),
            },
          },
          prompt,
        ]
      : prompt;

    const response = await generateWithRetry(contents, {
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(response.text);
    const storedText = ocrUsed
      ? (parsed.extractedText || parsed.summary || '').slice(0, 30000)
      : extractedText.slice(0, 30000);

    const cleanResult = {
      title: parsed.title || req.file.originalname,
      summary: parsed.summary || '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
    };

    // 3. Save to MongoDB
    const savedDoc = await Document.create({
      sessionId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mode,
      ocrUsed,
      extractedText: storedText,
      result: cleanResult,
      qaHistory: [],
    });

    const responseObj = savedDoc.toObject();
    delete responseObj.extractedText;

    console.log('[4] Saved to MongoDB with ID:', savedDoc._id);
    res.status(201).json(responseObj);
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

// Follow-up Q&A on an already analyzed document (no re-upload required)
app.post('/api/documents/:id/ask', askLimiter, async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID.' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }

    const question = req.body.question?.trim().slice(0, 500);
    if (!question) {
      return res.status(400).json({ error: 'Please enter a follow-up question.' });
    }

    const doc = await Document.findOne({ _id: req.params.id, sessionId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const contextText = doc.extractedText?.trim()
      ? doc.extractedText.slice(0, 28000)
      : JSON.stringify(doc.result);

    const recentQa = (doc.qaHistory || [])
      .slice(-4)
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');

    const prompt = `You are DocuSense AI. Answer the user's follow-up question concisely and accurately using ONLY the document context below. If the answer isn't in the document, say so clearly.

Document (${doc.fileName}):
"""
${contextText}
"""
${recentQa ? `\nPrevious Q&A:\n${recentQa}\n` : ''}
User question: ${question}`;

    const response = await generateWithRetry(prompt);
    const answer = response.text?.trim() || 'No answer could be generated.';

    const qaItem = { question, answer, createdAt: new Date() };
    doc.qaHistory.push(qaItem);
    await doc.save();

    res.json({ qa: qaItem, qaHistory: doc.qaHistory });
  } catch (error) {
    console.error('[ASK ERROR]:', error);
    const message =
      error.status === 503
        ? 'The AI service is temporarily busy. Please try again in a few seconds.'
        : error.status === 429
          ? 'API quota limit reached. Please try again in a minute.'
          : 'Failed to answer follow-up question.';
    res.status(error.status || 500).json({ error: message });
  }
});

// Delete a single document
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

// Clear all documents for this session
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
