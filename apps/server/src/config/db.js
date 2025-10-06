import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.warn('[mongo] MONGODB_URI not set; running without persistence');
    return null;
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'oschat' });
  // eslint-disable-next-line no-console
  console.log('[mongo] connected');
  return mongoose.connection;
}

