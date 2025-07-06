// src/app/api/user/find-people/route.ts
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
      console.log('Find People API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Find People API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      console.log('Find People API: Current User ID not found in token');
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/find-people');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Get search parameters from URL query
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('q') || ''; // Name search query
    const cityQuery = searchParams.get('city') || ''; // New: City search query
    const stateQuery = searchParams.get('state') || ''; // New: State search query

    console.log(`Find People API: Search params - Name: "${searchQuery}", City: "${cityQuery}", State: "${stateQuery}"`);


    // Define the base query to exclude the current user, existing friends, and pending users
    const currentUser = await usersCollection.findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { friends: 1, outgoingFriendRequests: 1, incomingFriendRequests: 1 } }
    );

    const excludedUserIds = [
      new ObjectId(currentUserId), // Exclude self
      ...(currentUser?.friends || []),
      ...(currentUser?.outgoingFriendRequests || []), // Exclude users to whom a request has been sent
      ...(currentUser?.incomingFriendRequests || []) // Exclude users from whom a request is pending
    ];

    console.log(`Find People API: Excluding user IDs (self, friends, outgoing, incoming requests): ${excludedUserIds.map(id => id.toString()).join(', ')}`);


    // Build the MongoDB query object
    const query: any = {
      _id: { $nin: excludedUserIds }, // Exclude specified users
    };

    // Add name search condition if 'q' is provided
    if (searchQuery) {
      // Case-insensitive regex search for name
      query.name = { $regex: searchQuery, $options: 'i' };
    }

    // Add city search condition if 'city' is provided
    if (cityQuery) {
      // Case-insensitive regex search for city
      query.city = { $regex: cityQuery, $options: 'i' };
    }

    // Add state search condition if 'state' is provided
    if (stateQuery) {
      // Case-insensitive regex search for state
      query.state = { $regex: stateQuery, $options: 'i' };
    }

    console.log('Find People API: Final MongoDB Query:', JSON.stringify(query));


    // Find users matching the criteria, projecting public fields
    const users = await usersCollection.find(query, {
      projection: {
        password: 0, // Exclude sensitive fields
        createdAt: 0,
        outgoingFriendRequests: 0,
        incomingFriendRequests: 0,
        friends: 0, // Exclude friends list from returned profile data
        spouse: 0,
        children: 0,
        email: 0, // Exclude email for general public search view
        isMatrimonyEnabled: 0, // Exclude matrimony status for general find people
        dateOfBirth: 0,
        timeOfBirth: 0,
        placeOfBirth: 0,
        fatherName: 0,
        motherName: 0,
        gender: 0,
        education: 0,
        matrimonyPictures: 0,
      }
    }).toArray();

    // Map to public-facing format and determine relationship status
    const publicUsers = users.map(user => {
      let relationshipStatus: 'SELF' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'NOT_FRIENDS';
      const userIdString = user._id.toString();

      if (userIdString === currentUserId) {
        relationshipStatus = 'SELF';
      } else if (currentUser?.friends?.some(id => id.equals(user._id))) {
        relationshipStatus = 'FRIENDS';
      } else if (currentUser?.outgoingFriendRequests?.some(id => id.equals(user._id))) {
        relationshipStatus = 'PENDING_OUTGOING';
      } else if (currentUser?.incomingFriendRequests?.some(id => id.equals(user._id))) {
        relationshipStatus = 'PENDING_INCOMING';
      } else {
        relationshipStatus = 'NOT_FRIENDS';
      }

      return {
        _id: userIdString,
        name: user.name,
        profilePicture: user.profilePicture || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        bio: user.bio || '',
        profession: user.profession || '', // Include profession for general find people
        relationshipStatus, // Include relationship status
      };
    });

    console.log(`Find People API: Found ${publicUsers.length} users matching search criteria for user ${currentUserId}.`);
    return NextResponse.json({ users: publicUsers }, { status: 200 });

  } catch (error) {
    console.error('Find People API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
