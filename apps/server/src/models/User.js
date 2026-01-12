import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    name: { 
      type: String, 
      required: true 
    },
    avatar: { 
      type: String,
      default: null 
    },
    googleId: { 
      type: String, 
      unique: true,
      sparse: true // allows null values while maintaining uniqueness
    },
    provider: { 
      type: String, 
      enum: ['google', 'local'],
      default: 'local'
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline'
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    socketId: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
