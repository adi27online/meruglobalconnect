// src/app/api/user/friend-requests/accept/route.ts
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
      console.error('Failed to connect to database in /api/user/friend-requests/accept');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    const senderObjectId = new ObjectId(senderId);
    const recipientObjectId = new ObjectId(recipientId);

    // Prevent accepting request from self
    if (senderId === recipientId) {
      return NextResponse.json({ error: 'Cannot accept friend request from yourself.' }, { status: 400 });
    }

    // Start a MongoDB session for an atomic transaction
    const session = db.client.startSession();
    session.startTransaction();

    try {
      // 3. Remove sender from recipient's incoming requests & add sender to recipient's friends
      const recipientUpdateResult = await usersCollection.updateOne(
        { _id: recipientObjectId },
        {
          $pull: { incomingFriendRequests: senderObjectId }, // Remove from incoming requests
          $addToSet: { friends: senderObjectId } // Add to friends list
        },
        { session }
      );

      // 4. Remove recipient from sender's outgoing requests & add recipient to sender's friends
      const senderUpdateResult = await usersCollection.updateOne(
        { _id: senderObjectId },
        {
          $pull: { outgoingFriendRequests: recipientObjectId }, // Remove from outgoing requests
          $addToSet: { friends: recipientObjectId } // Add to friends list
        },
        { session }
      );

      // Check if both updates were successful
      if (recipientUpdateResult.modifiedCount === 0 || senderUpdateResult.modifiedCount === 0) {
        // This could mean the request wasn't pending, or they were already friends etc.
        // Rollback and return a specific message
        await session.abortTransaction();
        return NextResponse.json({ error: 'Friend request not found or already processed.' }, { status: 400 });
      }

      await session.commitTransaction();
      console.log(`Friend request from ${senderId} accepted by ${recipientId}`);
      return NextResponse.json({ message: 'Friend request accepted successfully.' }, { status: 200 });

    } catch (transactionError) {
      await session.abortTransaction(); // Rollback on error
      console.error('Transaction failed during friend request acceptance:', transactionError);
      return NextResponse.json({ error: 'Failed to accept friend request due to a transaction error.' }, { status: 500 });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Accept Friend Request API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}