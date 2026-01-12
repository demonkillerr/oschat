import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: { 
      type: String, 
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    attachments: [{
      url: String,
      type: String,
      name: String,
      size: Number
    }],
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    deleted: {
      type: Boolean,
      default: false
    },
    // Legacy fields for backward compatibility
    user: { type: String },
    ts: { type: Number }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient querying
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

