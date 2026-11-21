import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mode: {
      type: String,
      enum: ['summarize', 'extract', 'bullets'],
      default: 'summarize',
    },
    result: {
      title: { type: String, required: true },
      summary: { type: String, required: true },
      keyPoints: [{ type: String }],
      entities: [entitySchema],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
