// src/app/api/user/conversations/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc, ConversationDoc } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the current user (the initiator of the conversation)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Start Conversation API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Current User ID not found in token' }, { status: 401 });
    }

    // 2. Get the target friend's ID from the request body
    const { friendId } = await req.json();

    if (!friendId || !ObjectId.isValid(friendId)) {
      return NextResponse.json({ error: 'Invalid friend ID provided.' }, { status: 400 });
    }

    // Prevent starting conversation with self
    if (currentUserId === friendId) {
      return NextResponse.json({ error: 'Cannot start a conversation with yourself.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/conversations/start');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');
    const conversationsCollection = db.collection<ConversationDoc>('conversations');

    const currentUserObjectId = new ObjectId(currentUserId);
    const friendObjectId = new ObjectId(friendId);

    // 3. Verify that they are friends
    // Fetch current user's document to check their friends list
    const currentUser = await usersCollection.findOne(
      { _id: currentUserObjectId },
      { projection: { friends: 1 } }
    );

    if (!currentUser || !currentUser.friends || !currentUser.friends.some(fId => fId.equals(friendObjectId))) {
      return NextResponse.json({ error: 'You can only start a conversation with a friend.' }, { status: 403 });
    }

    // 4. Check if a conversation between these two participants already exists
    // Participants array should contain both IDs, regardless of order
    const existingConversation = await conversationsCollection.findOne({
      participants: {
        $all: [currentUserObjectId, friendObjectId], // Both must be present
        $size: 2 // And there should only be two participants (for 1:1 chat)
      }
    });

    if (existingConversation) {
      console.log(`Conversation already exists between ${currentUserId} and ${friendId}. Returning existing conversation.`);
      return NextResponse.json(
        { message: 'Conversation already exists.', conversationId: existingConversation._id.toString() },
        { status: 200 } // 200 OK because we're returning existing resource
      );
    }

    // 5. If no existing conversation, create a new one
    const newConversation: Omit<ConversationDoc, '_id'> = {
      participants: [currentUserObjectId, friendObjectId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await conversationsCollection.insertOne(newConversation);
    const newConversationId = result.insertedId;

    // 6. Update both users' documents to include the new conversation ID
    await usersCollection.updateMany(
      { _id: { $in: [currentUserObjectId, friendObjectId] } },
      { $addToSet: { conversations: newConversationId } } // Add conversation ID to both users' lists
    );

    console.log(`New conversation created: ${newConversationId} between ${currentUserId} and ${friendId}.`);
    return NextResponse.json(
      { message: 'Conversation started successfully.', conversationId: newConversationId.toString() },
      { status: 201 } // 201 Created for new resource
    );

  } catch (error) {
    console.error('Start Conversation API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}