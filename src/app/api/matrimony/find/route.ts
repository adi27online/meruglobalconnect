// src/app/api/matrimony/find/route.ts
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
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Find Matrimony Profiles API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/matrimony/find');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Parse query parameters for search and filters
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const country = searchParams.get('country') || '';

    // Build the query object
    const query: any = {
      _id: { $ne: new ObjectId(currentUserId) }, // Exclude the current user
      isMatrimonyEnabled: true, // Only fetch users who have enabled matrimony profile
    };

    if (searchQuery) {
      // Case-insensitive search on name, bio, profession
      const regex = new RegExp(searchQuery, 'i');
      query.$or = [
        { name: regex },
        { bio: regex },
        { profession: regex },
        { fatherName: regex },
        { motherName: regex },
        { education: regex },
      ];
    }
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    if (state) {
      query.state = new RegExp(state, 'i');
    }
    if (country) {
      query.country = new RegExp(country, 'i');
    }

    // 2. Fetch users based on the query and criteria
    const users = await usersCollection.find(
      query,
      {
        projection: {
          // Only include public/matrimony fields (all inclusions!)
          name: 1,
          profilePicture: 1,
          city: 1,
          state: 1,
          country: 1,
          bio: 1,
          profession: 1,
          isMatrimonyEnabled: 1,
          dateOfBirth: 1,
          timeOfBirth: 1,
          placeOfBirth: 1,
          fatherName: 1,
          motherName: 1,
          gender: 1,
          education: 1,
          matrimonyPictures: 1,
        }
      }
    ).toArray();

    // 3. Determine relationship status for each user
    const currentUserDoc = await usersCollection.findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { friends: 1, outgoingFriendRequests: 1, incomingFriendRequests: 1 } }
    );

    const currentUserFriends = currentUserDoc?.friends?.map(id => id.toString()) || [];
    const currentUserOutgoingRequests = currentUserDoc?.outgoingFriendRequests?.map(id => id.toString()) || [];
    const currentUserIncomingRequests = currentUserDoc?.incomingFriendRequests?.map(id => id.toString()) || [];

    const formattedUsers = users.map(user => {
      let relationshipStatus: 'SELF' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'NOT_FRIENDS';
      const userIdString = user._id.toString();

      if (userIdString === currentUserId) {
        relationshipStatus = 'SELF';
      } else if (currentUserFriends.includes(userIdString)) {
        relationshipStatus = 'FRIENDS';
      } else if (currentUserOutgoingRequests.includes(userIdString)) {
        relationshipStatus = 'PENDING_OUTGOING';
      } else if (currentUserIncomingRequests.includes(userIdString)) {
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
        profession: user.profession || '',
        isMatrimonyEnabled: user.isMatrimonyEnabled || false,
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : '',
        timeOfBirth: user.timeOfBirth || '',
        placeOfBirth: user.placeOfBirth || '',
        fatherName: user.fatherName || '',
        motherName: user.motherName || '',
        gender: user.gender || '',
        education: user.education || '',
        matrimonyPictures: user.matrimonyPictures || [],
        relationshipStatus,
      };
    });

    console.log(`Find Matrimony Profiles API: Found ${formattedUsers.length} matching profiles.`);
    return NextResponse.json({ users: formattedUsers }, { status: 200 });

  } catch (error) {
    console.error('Find Matrimony Profiles API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
