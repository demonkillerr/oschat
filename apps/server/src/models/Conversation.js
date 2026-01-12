import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null // null for 1-on-1 chats
    },
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    avatar: {
      type: String,
      default: null
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient querying
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Virtual for getting other participant in direct chat
ConversationSchema.virtual('otherParticipant').get(function() {
  if (this.type === 'direct' && this.participants.length === 2) {
    return this.participants[1];
  }
  return null;
});

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
