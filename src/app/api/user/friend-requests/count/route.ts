// src/app/api/user/friend-requests/count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the current user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      // For a count API, we can return 0 if not authenticated, or a 401 if strict.
      // Returning 0 for count is safer to avoid endless login redirects from polling.
      return NextResponse.json({ count: 0, error: 'Not authenticated' }, { status: 200 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Incoming Friend Requests Count API: Token verification failed:', error);
      return NextResponse.json({ count: 0, error: 'Invalid or expired token' }, { status: 200 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      console.log('Incoming Friend Requests Count API: Current User ID not found in token');
      return NextResponse.json({ count: 0, error: 'User ID not found in token' }, { status: 200 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/friend-requests/count');
      return NextResponse.json({ count: 0, error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // 2. Find the current user and get the count of incomingFriendRequests
    const currentUser = await usersCollection.findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { incomingFriendRequests: 1 } } // Only project incomingFriendRequests field
    );

    if (!currentUser) {
      console.log(`Incoming Friend Requests Count API: Current user not found for ID: ${currentUserId}`);
      return NextResponse.json({ count: 0, error: 'User not found' }, { status: 404 });
    }

    const count = currentUser.incomingFriendRequests ? currentUser.incomingFriendRequests.length : 0;

    console.log(`Incoming Friend Requests Count API: User ${currentUserId} has ${count} pending requests.`);
    return NextResponse.json({ count }, { status: 200 });

  } catch (error) {
    console.error('Incoming Friend Requests Count API Error:', error);
    return NextResponse.json({ count: 0, error: 'Internal server error.' }, { status: 500 });
  }
}