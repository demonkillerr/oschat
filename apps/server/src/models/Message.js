import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    text: { type: String, required: true },
    ts: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

