// src/app/api/user/friend-requests/send/route.ts // <-- UPDATED PATH (PLURAL)
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
      console.log('Send Friend Request API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
      console.log('Send Friend Request API: Token decoded for userId:', decoded.id);
    } catch (error) {
      console.error('Send Friend Request API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const senderId = decoded.id;
    if (!senderId) {
      console.log('Send Friend Request API: Sender ID not found in token');
      return NextResponse.json({ error: 'Sender ID not found in token' }, { status: 401 });
    }

    // 2. Get the recipient ID from the request body
    const { recipientId } = await req.json();
    console.log(`Send Friend Request API: Request to send friend request from ${senderId} to ${recipientId}`);

    if (!recipientId || !ObjectId.isValid(recipientId)) {
      console.log('Send Friend Request API: Invalid recipient ID provided:', recipientId);
      return NextResponse.json({ error: 'Invalid recipient ID provided.' }, { status: 400 });
    }

    // Ensure sender is not sending request to themselves
    if (senderId === recipientId) {
      console.log('Send Friend Request API: Attempted to send request to self.');
      return NextResponse.json({ error: 'Cannot send friend request to yourself.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/friend-requests/send'); // UPDATED PATH (PLURAL)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Convert string IDs to ObjectId for MongoDB queries
    const senderObjectId = new ObjectId(senderId);
    const recipientObjectId = new ObjectId(recipientId);

    // 3. Check if recipient exists
    const recipient = await usersCollection.findOne({ _id: recipientObjectId });
    if (!recipient) {
      console.log(`Send Friend Request API: Recipient user not found for ID: ${recipientId}`);
      return NextResponse.json({ error: 'Recipient user not found.' }, { status: 404 });
    }

    // 4. Check if request already exists (outgoing from sender, incoming to recipient)
    const senderDoc = await usersCollection.findOne(
        { _id: senderObjectId },
        { projection: { outgoingFriendRequests: 1, friends: 1 } }
    );

    const recipientDoc = await usersCollection.findOne(
        { _id: recipientObjectId },
        { projection: { incomingFriendRequests: 1, friends: 1 } }
    );

    // Check if they are already friends
    if (senderDoc?.friends?.includes(recipientObjectId) || recipientDoc?.friends?.includes(senderObjectId)) {
        console.log(`Send Friend Request API: Already friends with ${recipientId}.`);
        return NextResponse.json({ message: 'You are already friends with this user.' }, { status: 409 });
    }

    // Check if sender already sent a request to this recipient
    if (senderDoc?.outgoingFriendRequests?.includes(recipientObjectId)) {
      console.log(`Send Friend Request API: Friend request already sent from ${senderId} to ${recipientId}.`);
      return NextResponse.json({ message: 'Friend request already sent.' }, { status: 409 });
    }

    // Check if recipient already sent a request to sender (meaning a pending request for sender)
    if (recipientDoc?.outgoingFriendRequests?.includes(senderObjectId)) {
        console.log(`Send Friend Request API: Friend request already pending from recipient ${recipientId}. Accept instead.`);
        return NextResponse.json({ message: 'Friend request already pending from recipient. Accept instead.' }, { status: 409 });
    }


    // 5. Update sender's document: Add recipientId to outgoingFriendRequests
    const senderUpdateResult = await usersCollection.updateOne(
      { _id: senderObjectId },
      {
        $addToSet: { // $addToSet ensures unique values in the array
          outgoingFriendRequests: recipientObjectId,
        }
      }
    );
    console.log(`Send Friend Request API: Sender ${senderId} update result (outgoing requests):`, senderUpdateResult);

    // 6. Update recipient's document: Add senderId to incomingFriendRequests
    const recipientUpdateResult = await usersCollection.updateOne(
      { _id: recipientObjectId },
      {
        $addToSet: { // $addToSet ensures unique values in the array
          incomingFriendRequests: senderObjectId,
        }
      }
    );
    console.log(`Send Friend Request API: Recipient ${recipientId} update result (incoming requests):`, recipientUpdateResult);


    // Check if both updates were successful (at least one modified, for initial send)
    if (senderUpdateResult.modifiedCount === 0 && recipientUpdateResult.modifiedCount === 0) {
        // This case would imply the documents were not updated, which should be caught by earlier checks
        // but acts as a final safeguard.
        console.error('Send Friend Request API: Neither sender nor recipient document was modified, but no explicit conflict detected earlier.');
        return NextResponse.json({ error: 'Failed to update user records for friend request.' }, { status: 500 });
    }

    console.log(`Friend request sent successfully from ${senderId} to ${recipientId}`);
    return NextResponse.json({ message: 'Friend request sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Send Friend Request API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}