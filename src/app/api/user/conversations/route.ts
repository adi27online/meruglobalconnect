// src/app/api/user/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc, ConversationDoc, MessageDoc } from '@/types/user';

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
      console.log('Fetch Conversations API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Fetch Conversations API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      console.log('Fetch Conversations API: Current User ID not found in token');
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/conversations');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');
    const conversationsCollection = db.collection<ConversationDoc>('conversations');
    const messagesCollection = db.collection<MessageDoc>('messages');

    const currentUserObjectId = new ObjectId(currentUserId);

    // 2. Find the current user to get their conversation IDs
    const currentUser = await usersCollection.findOne(
      { _id: currentUserObjectId },
      { projection: { conversations: 1 } }
    );

    const conversationIds = currentUser?.conversations || [];
    console.log(`Fetch Conversations API: User ${currentUserId} has ${conversationIds.length} conversations.`);

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] }, { status: 200 });
    }

    // 3. Fetch conversation details, sort by most recent activity
    const conversations = await conversationsCollection.find(
      { _id: { $in: conversationIds } }
    )
    .sort({ updatedAt: -1 }) // Sort by most recently updated conversations
    .toArray();

    // 4. Populate participant and last message details for each conversation
    const populatedConversations = await Promise.all(conversations.map(async (conv) => {
      // Fetch participant details (only the other participant's info)
      const otherParticipantId = conv.participants.find(pId => !pId.equals(currentUserObjectId));
      let participants = [];
      if (otherParticipantId) {
        const otherUser = await usersCollection.findOne(
          { _id: otherParticipantId },
          { projection: { name: 1, profilePicture: 1 } } // Only fetch name and profile picture
        );
        if (otherUser) {
          participants.push({
            _id: otherUser._id.toString(),
            name: otherUser.name,
            profilePicture: otherUser.profilePicture || '',
          });
        }
      }

      // Fetch last message details
      let lastMessage = null;
      if (conv.lastMessage) {
        const message = await messagesCollection.findOne({ _id: conv.lastMessage });
        if (message) {
          lastMessage = {
            _id: message._id.toString(),
            senderId: message.senderId.toString(),
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          };
        }
      }

      return {
        _id: conv._id.toString(),
        participants: participants, // This will only include the other participant for now
        lastMessage: lastMessage,
        updatedAt: conv.updatedAt.toISOString(),
      };
    }));

    console.log(`Fetch Conversations API: Successfully populated ${populatedConversations.length} conversations.`);
    return NextResponse.json({ conversations: populatedConversations }, { status: 200 });

  } catch (error) {
    console.error('Fetch Conversations API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}