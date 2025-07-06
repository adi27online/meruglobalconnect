// src/app/api/user/[id]/profile-public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userIdToView } = await params; // FIX: Await params

    if (!userIdToView || !ObjectId.isValid(userIdToView)) {
      return NextResponse.json({ error: 'Invalid user ID provided.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    const usersCollection = db.collection('users');

    // Authenticate viewer (to show relationship status)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    let viewerId = null;
    if (token && JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        viewerId = decoded.id;
      } catch (err) {
        // ignore auth error, treat as not logged in
      }
    }

    // Use inclusion-only or exclusion-only projection, not mixed!
    // Let's use inclusion: only send public fields you need:
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userIdToView) },
      {
        projection: {
          _id: 1,
          name: 1,
          profilePicture: 1,
          city: 1,
          state: 1,
          country: 1,
          bio: 1,
          profession: 1,
          spouseName: 1,
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
          friends: 1,
          outgoingFriendRequests: 1,
          incomingFriendRequests: 1,
        }
      }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Compute relationship status
    let relationshipStatus: PublicUser['relationshipStatus'] = 'NOT_FRIENDS';
    if (viewerId && viewerId === user._id.toString()) {
      relationshipStatus = 'SELF';
    } else if (user.friends?.map((id: ObjectId) => id.toString()).includes(viewerId)) {
      relationshipStatus = 'FRIENDS';
    } else if (user.incomingFriendRequests?.map((id: ObjectId) => id.toString()).includes(viewerId)) {
      relationshipStatus = 'PENDING_OUTGOING';
    } else if (user.outgoingFriendRequests?.map((id: ObjectId) => id.toString()).includes(viewerId)) {
      relationshipStatus = 'PENDING_INCOMING';
    }

    // Remove internal fields before sending
    const resultUser: any = {
      _id: user._id.toString(),
      name: user.name,
      profilePicture: user.profilePicture || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      bio: user.bio || '',
      profession: user.profession || '',
      spouseName: user.spouseName || '',
      children: user.children || [],
      isMatrimonyEnabled: user.isMatrimonyEnabled,
      dateOfBirth: user.dateOfBirth ? (typeof user.dateOfBirth === 'string' ? user.dateOfBirth : user.dateOfBirth.toISOString()) : '',
      timeOfBirth: user.timeOfBirth || '',
      placeOfBirth: user.placeOfBirth || '',
      fatherName: user.fatherName || '',
      motherName: user.motherName || '',
      gender: user.gender || '',
      education: user.education || '',
      matrimonyPictures: user.matrimonyPictures || [],
      relationshipStatus,
    };

    return NextResponse.json({ user: resultUser }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch Public Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
