// src/app/api/conversation/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc, ConversationDoc, MessageDoc } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    // 1. Authenticate the current user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Fetch Messages API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Current User ID not found in token' }, { status: 401 });
    }

    // Await params before destructuring to ensure value is resolved
    const { conversationId } = await params; 

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      console.log('Fetch Messages API: Invalid conversation ID provided:', conversationId);
      return NextResponse.json({ error: 'Invalid conversation ID provided.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/conversation/[conversationId]/messages');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const conversationsCollection = db.collection<ConversationDoc>('conversations');
    const messagesCollection = db.collection<MessageDoc>('messages');

    const conversationObjectId = new ObjectId(conversationId);
    const currentUserObjectId = new ObjectId(currentUserId);

    // 2. Verify that the current user is a participant in this conversation
    const conversation = await conversationsCollection.findOne({
      _id: conversationObjectId,
      participants: currentUserObjectId // Ensure current user is part of this conversation
    });

    if (!conversation) {
      console.log(`Fetch Messages API: Conversation ${conversationId} not found or user ${currentUserId} is not a participant.`);
      return NextResponse.json({ error: 'Conversation not found or access denied.' }, { status: 404 });
    }

    // 3. Fetch all messages for this conversation, ordered by creation time
    const messages = await messagesCollection.find(
      { conversationId: conversationObjectId }
    ).sort({ createdAt: 1 }) // Sort oldest to newest
      .toArray();

    // 4. Map messages to a client-friendly format
    const formattedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId.toString(),
      content: msg.content,
      createdAt: msg.createdAt.toISOString(), // Convert Date to ISO string
    }));

    console.log(`Fetch Messages API: Retrieved ${formattedMessages.length} messages for conversation ${conversationId}.`);
    return NextResponse.json({ messages: formattedMessages }, { status: 200 });

  } catch (error) {
    console.error('Fetch Messages API Error:', error);
    // Ensure that in case of any unhandled error, a valid JSON response is always sent
    return NextResponse.json({ error: 'Internal server error while fetching messages.' }, { status: 500 });
  }
}