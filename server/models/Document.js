import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mode: {
      type: String,
      enum: ['summarize', 'extract', 'bullets', 'email', 'custom'],
      default: 'summarize',
    },
    ocrUsed: { type: Boolean, default: false },
    extractedText: { type: String, default: '' },
    result: {
      title: { type: String, required: true },
      summary: { type: String, required: true },
      keyPoints: [{ type: String }],
      entities: [entitySchema],
    },
    qaHistory: [qaSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
