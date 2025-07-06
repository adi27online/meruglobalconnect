// src/app/api/user/send-friend-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user'; // Ensure UserDoc is correctly defined

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the sender
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

    const senderId = decoded.id;
    if (!senderId) {
      return NextResponse.json({ error: 'Sender ID not found in token' }, { status: 401 });
    }

    // 2. Get the recipient ID from the request body
    const { recipientId } = await req.json();

    if (!recipientId || !ObjectId.isValid(recipientId)) {
      return NextResponse.json({ error: 'Invalid recipient ID provided.' }, { status: 400 });
    }

    // Ensure sender is not sending request to themselves
    if (senderId === recipientId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/send-friend-request');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Convert string IDs to ObjectId for MongoDB queries
    const senderObjectId = new ObjectId(senderId);
    const recipientObjectId = new ObjectId(recipientId);

    // 3. Check if recipient exists
    const recipient = await usersCollection.findOne({ _id: recipientObjectId });
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient user not found.' }, { status: 404 });
    }

    // 4. Check if request already exists (outgoing from sender, incoming to recipient)
    // We will store outgoing requests in sender's document and incoming in recipient's.
    // For simplicity, let's assume a new array field in UserDoc for this:
    // UserDoc: { ..., outgoingFriendRequests: ObjectId[], incomingFriendRequests: ObjectId[] }

    // Check if sender already sent a request to this recipient
    const sender = await usersCollection.findOne(
      {
        _id: senderObjectId,
        'outgoingFriendRequests': recipientObjectId // Check if recipient's ID is in sender's outgoing requests
      }
    );
    if (sender) {
      return NextResponse.json({ message: 'Friend request already sent.' }, { status: 409 });
    }

    // Check if recipient already sent a request to sender (meaning a pending request for sender)
    const recipientHasIncoming = await usersCollection.findOne(
        {
            _id: recipientObjectId,
            'outgoingFriendRequests': senderObjectId // Check if sender's ID is in recipient's outgoing requests (which is incoming for sender)
        }
    );
    if (recipientHasIncoming) {
        return NextResponse.json({ message: 'Friend request already pending from recipient. Accept instead.' }, { status: 409 });
    }


    // 5. Update sender's document: Add recipientId to outgoingFriendRequests
    await usersCollection.updateOne(
      { _id: senderObjectId },
      {
        $addToSet: { // $addToSet ensures unique values in the array
          outgoingFriendRequests: recipientObjectId,
        }
      }
    );

    // 6. Update recipient's document: Add senderId to incomingFriendRequests
    await usersCollection.updateOne(
      { _id: recipientObjectId },
      {
        $addToSet: { // $addToSet ensures unique values in the array
          incomingFriendRequests: senderObjectId,
        }
      }
    );

    console.log(`Friend request sent from ${senderId} to ${recipientId}`);
    return NextResponse.json({ message: 'Friend request sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Send Friend Request API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}