// src/app/api/user/friend-requests/reject/route.ts // <-- UPDATED PATH (PLURAL)
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user'; // Ensure UserDoc is correctly defined with friend arrays

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the current user (recipient of the request)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const recipientId = decoded.id; // The current user is the recipient
    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID not found in token' }, { status: 401 });
    }

    // 2. Get the sender's ID from the request body
    const { senderId } = await req.json();

    if (!senderId || !ObjectId.isValid(senderId)) {
      return NextResponse.json({ error: 'Invalid sender ID provided.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/friend-requests/reject'); // UPDATED PATH (PLURAL)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    const senderObjectId = new ObjectId(senderId);
    const recipientObjectId = new ObjectId(recipientId);

    // Prevent rejecting request from self
    if (senderId === recipientId) {
      return NextResponse.json({ error: 'Cannot reject friend request from yourself.' }, { status: 400 });
    }

    // 3. Remove sender from recipient's incoming requests (no other updates needed)
    const recipientUpdateResult = await usersCollection.updateOne(
      { _id: recipientObjectId },
      { $pull: { incomingFriendRequests: senderObjectId } } // Remove from incoming requests
    );

    // 4. Also remove recipient from sender's outgoing requests
    // This cleans up the sender's side even if the recipient rejects
    const senderUpdateResult = await usersCollection.updateOne(
        { _id: senderObjectId },
        { $pull: { outgoingFriendRequests: recipientObjectId } }
    );

    // Check if at least one update occurred (meaning a request was present to remove)
    if (recipientUpdateResult.modifiedCount === 0 && senderUpdateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Friend request not found or already processed.' }, { status: 400 });
    }

    console.log(`Friend request from ${senderId} rejected by ${recipientId}`);
    return NextResponse.json({ message: 'Friend request rejected successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Reject Friend Request API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}