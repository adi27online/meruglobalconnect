// src/app/api/user/friend-requests/incoming/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user'; // Import UserDoc for type safety

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
      console.log('Incoming Friend Requests API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Incoming Friend Requests API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      console.log('Incoming Friend Requests API: Current User ID not found in token');
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/friend-requests/incoming');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // 2. Find the current user to get their incomingFriendRequests
    const currentUser = await usersCollection.findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { incomingFriendRequests: 1 } } // Only project incomingFriendRequests field
    );

    if (!currentUser) {
      console.log(`Incoming Friend Requests API: Current user not found for ID: ${currentUserId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const incomingRequestIds = currentUser.incomingFriendRequests || [];
    console.log(`Incoming Friend Requests API: Found ${incomingRequestIds.length} incoming request IDs for user ${currentUserId}.`);

    if (incomingRequestIds.length === 0) {
      return NextResponse.json({ requests: [] }, { status: 200 }); // No requests, return empty array
    }

    // 3. Fetch the public profiles of the users who sent these requests
    const incomingRequests = await usersCollection.find(
      { _id: { $in: incomingRequestIds } }, // Find users whose IDs are in the incomingRequestIds array
      {
        projection: {
          password: 0, // Exclude sensitive fields
          createdAt: 0,
          outgoingFriendRequests: 0,
          incomingFriendRequests: 0,
          friends: 0,
          spouse: 0, // Exclude spouse for public view
          children: 0, // Exclude children for public view
        }
      }
    ).toArray();

    // 4. Map to public-facing format and ensure _id is string
    const publicIncomingRequests = incomingRequests.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      profilePicture: user.profilePicture || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      bio: user.bio || '',
    }));

    console.log(`Incoming Friend Requests API: Retrieved ${publicIncomingRequests.length} public profiles for incoming requests.`);
    return NextResponse.json({ requests: publicIncomingRequests }, { status: 200 });

  } catch (error) {
    console.error('Incoming Friend Requests API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}