// src/app/api/user/public-profile/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Please set it in your .env.local file.');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdToView = params.id; // Get the user ID from the dynamic route parameter

    if (!userIdToView || !ObjectId.isValid(userIdToView)) {
      console.log('Public Profile API: Invalid user ID provided:', userIdToView);
      return NextResponse.json({ error: 'Invalid user ID provided.' }, { status: 400 });
    }

    // Authenticate the current user (the one making the request)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('Public Profile API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Public Profile API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = decoded.id; // This is the ID of the user who is logged in
    if (!currentUserId) {
      console.log('Public Profile API: Current User ID not found in token');
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/public-profile/[id]');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Find the user whose profile is being requested
    const userToView = await usersCollection.findOne(
      { _id: new ObjectId(userIdToView) },
      {
        projection: {
          password: 0, // Exclude sensitive fields
          createdAt: 0,
          email: 0, // Exclude email for public view
          outgoingFriendRequests: 0,
          incomingFriendRequests: 0,
          conversations: 0,
          // Include all public profile fields
          name: 1,
          city: 1,
          state: 1,
          country: 1,
          bio: 1,
          profession: 1,
          hobbies: 1,
          profilePicture: 1,
          spouse: 1,
          children: 1,
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
    );

    if (!userToView) {
      console.log(`Public Profile API: User not found for ID: ${userIdToView}`);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Determine relationship status between the current user and the user being viewed
    const currentUserDoc = await usersCollection.findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { friends: 1, outgoingFriendRequests: 1, incomingFriendRequests: 1 } }
    );

    const currentUserFriends = currentUserDoc?.friends?.map(id => id.toString()) || [];
    const currentUserOutgoingRequests = currentUserDoc?.outgoingFriendRequests?.map(id => id.toString()) || [];
    const currentUserIncomingRequests = currentUserDoc?.incomingFriendRequests?.map(id => id.toString()) || [];

    let relationshipStatus: 'SELF' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'NOT_FRIENDS';
    const userToViewIdString = userToView._id.toString();

    if (userToViewIdString === currentUserId) {
      relationshipStatus = 'SELF';
    } else if (currentUserFriends.includes(userToViewIdString)) {
      relationshipStatus = 'FRIENDS';
    } else if (currentUserOutgoingRequests.includes(userToViewIdString)) {
      relationshipStatus = 'PENDING_OUTGOING';
    } else if (currentUserIncomingRequests.includes(userToViewIdString)) {
      relationshipStatus = 'PENDING_INCOMING';
    } else {
      relationshipStatus = 'NOT_FRIENDS';
    }

    // Format the user profile for the frontend
    const publicProfile = {
      _id: userToView._id.toString(),
      name: userToView.name,
      city: userToView.city || '',
      state: userToView.state || '',
      country: userToView.country || '',
      bio: userToView.bio || '',
      profession: userToView.profession || '',
      hobbies: userToView.hobbies || [],
      profilePicture: userToView.profilePicture || '',
      spouse: userToView.spouse || undefined,
      children: userToView.children || [],
      isMatrimonyEnabled: userToView.isMatrimonyEnabled || false,
      dateOfBirth: userToView.dateOfBirth ? userToView.dateOfBirth.toISOString() : '',
      timeOfBirth: userToView.timeOfBirth || '',
      placeOfBirth: userToView.placeOfBirth || '',
      fatherName: userToView.fatherName || '',
      motherName: userToView.motherName || '',
      gender: userToView.gender || '',
      education: userToView.education || '',
      matrimonyPictures: userToView.matrimonyPictures || [],
      relationshipStatus, // Include relationship status
    };

    console.log(`Public Profile API: Fetched profile for ID ${userIdToView}. Relationship: ${relationshipStatus}`);
    return NextResponse.json(publicProfile, { status: 200 });

  } catch (error) {
    console.error('Public Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
