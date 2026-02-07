import mongoose from "mongoose";

// Define the shape of our MongoDB connection cache
interface MongooseCache {
  conn: typeof mongoose | null;      // Connected mongoose instance
  promise: Promise<typeof mongoose> | null;  // Connection promise
}

// Extend global object to store our cache between serverless function calls
declare global {
  var mongoose: MongooseCache | undefined;
}

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI as string;

// Validate that MongoDB URI is configured
if (!MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// Initialize or reuse global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection pooling
 * Reuses existing connection in serverless environments
 * @returns Mongoose connection instance
 */
export async function connectDB() {
  // Ensure cache exists (for TypeScript safety)
  if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
  }
  
  // Return existing connection if available
  if (cached.conn) return cached.conn;

  // Create new connection promise if one doesn't exist
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  // Wait for connection and cache it
  cached.conn = await cached.promise;
  return cached.conn;
}