// src/app/api/conversation/[conversationId]/message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc, ConversationDoc, MessageDoc } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    // 1. Authenticate the current user (sender of the message)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Send Message API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const senderId = decoded.id;
    if (!senderId) {
      return NextResponse.json({ error: 'Sender ID not found in token' }, { status: 401 });
    }

    // Await params before destructuring to ensure value is resolved
    const { conversationId } = await params;

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation ID provided.' }, { status: 400 });
    }

    // 2. Get the message content from the request body
    const { content } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/conversation/[conversationId]/message');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const conversationsCollection = db.collection<ConversationDoc>('conversations');
    const messagesCollection = db.collection<MessageDoc>('messages');

    const conversationObjectId = new ObjectId(conversationId);
    const senderObjectId = new ObjectId(senderId);

    // 3. Verify that the sender is a participant in this conversation
    const conversation = await conversationsCollection.findOne({
      _id: conversationObjectId,
      participants: senderObjectId // Ensure sender is part of this conversation
    });

    if (!conversation) {
      console.log(`Send Message API: Conversation ${conversationId} not found or user ${senderId} is not a participant.`);
      return NextResponse.json({ error: 'Conversation not found or access denied.' }, { status: 404 });
    }

    // Start a MongoDB session for an atomic transaction
    const session = db.client.startSession();
    session.startTransaction();

    try {
      // 4. Create and insert the new message
      const newMessage: Omit<MessageDoc, '_id'> = {
        conversationId: conversationObjectId,
        senderId: senderObjectId,
        content: content.trim(),
        createdAt: new Date(),
      };

      const messageResult = await messagesCollection.insertOne(newMessage, { session });
      const newMessageId = messageResult.insertedId;

      // 5. Update the conversation's lastMessage and updatedAt fields
      await conversationsCollection.updateOne(
        { _id: conversationObjectId },
        {
          $set: {
            lastMessage: newMessageId,
            updatedAt: new Date(),
          }
        },
        { session }
      );

      await session.commitTransaction();
      console.log(`Message sent: ${newMessageId} in conversation ${conversationId} by ${senderId}.`);
      return NextResponse.json({ message: 'Message sent successfully.', messageId: newMessageId.toString() }, { status: 201 });

    } catch (transactionError) {
      await session.abortTransaction(); // Rollback on error
      console.error('Transaction failed during message send:', transactionError);
      return NextResponse.json({ error: 'Failed to send message due to a transaction error.' }, { status: 500 });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Send Message API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}