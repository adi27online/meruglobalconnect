
// lib/db.ts
import { MongoClient, Db } from 'mongodb';

// Ensure MONGODB_URI is defined in your .env.local file
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Cached connection for development to prevent multiple connections on hot reloads
// This is important for Next.js API Routes to avoid exhausting database connections
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  // If a database connection is already cached, return it
  if (cachedDb) {
    return cachedDb;
  }

  // If a client is cached but the specific db object isn't (rare, but a safeguard)
  if (cachedClient) {
    cachedDb = cachedClient.db(); // Get the default database from the client
    return cachedDb;
  }

  // If no client is cached, create a new MongoClient instance
  // The '!' asserts that MONGODB_URI is defined (due to the check above)
  const client = new MongoClient(MONGODB_URI!, {});
  
  // Connect to the MongoDB cluster
  await client.connect(); 

  // Get the default database from the connection URI
  // You can also specify a database name here if your URI doesn't include one
  const db = client.db(); 

  // Cache the client and db for future use
  cachedClient = client;
  cachedDb = db;

  console.log('MongoDB Connected!'); // Log success to your terminal
  return db;
}