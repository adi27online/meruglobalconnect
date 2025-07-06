// src/app/api/user/update-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user'; // Ensure UserDoc has all necessary fields including new ones

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

export async function PUT(req: NextRequest) {
  // Use PUT for updating an existing resource
  try {
    // 1. Authenticate the user from the token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('Update Profile API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
      console.log('Update Profile API: Token decoded for userId:', decoded.id);
    } catch (error) {
      console.error('Update Profile API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.id;
    if (!userId) {
      console.log('Update Profile API: User ID not found in token');
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    // 2. Parse the request body for updated profile data
    const { 
      name, city, state, country, bio, profession, hobbies, profilePicture, spouse, children, isMatrimonyEnabled,
      dateOfBirth, timeOfBirth, placeOfBirth, fatherName, motherName, gender, education, matrimonyPictures // ALL NEW: Matrimony specific fields
    } = await req.json();
    console.log('Update Profile API: Received data for update:', { 
      name, city, state, country, bio, profession, hobbies, profilePicture, spouse, children, isMatrimonyEnabled,
      dateOfBirth, timeOfBirth, placeOfBirth, fatherName, motherName, gender, education, matrimonyPictures
    });


    // Basic validation for required fields if necessary, e.g., name
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/user/update-profile');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Prepare the update document parts for $set and $unset
    const setFields: { [key: string]: any } = {
      name,
      city: city || '',
      state: state || '',
      country: country || '',
      
      bio: bio || '',
      profession: profession || '', // General profession
      hobbies: Array.isArray(hobbies) ? hobbies : [],
      profilePicture: profilePicture || '',
      spouse: spouse || undefined,
      children: Array.isArray(children) ? children : [],
      isMatrimonyEnabled: typeof isMatrimonyEnabled === 'boolean' ? isMatrimonyEnabled : false, 
    };

    const unsetFields: { [key: string]: number } = {};

    // Conditionally set/unset matrimony details based on isMatrimonyEnabled
    if (isMatrimonyEnabled) {
        setFields.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined; // Convert ISO string to Date object
        setFields.timeOfBirth = timeOfBirth || '';
        setFields.placeOfBirth = placeOfBirth || '';
        setFields.fatherName = fatherName || '';
        setFields.motherName = motherName || '';
        setFields.gender = gender || '';
        setFields.education = education || '';
        setFields.matrimonyPictures = Array.isArray(matrimonyPictures) ? matrimonyPictures : []; // Ensure it's an array
    } else {
        // If matrimony is disabled, ensure these fields are removed from the document
        unsetFields.dateOfBirth = 1;
        unsetFields.timeOfBirth = 1;
        unsetFields.placeOfBirth = 1;
        unsetFields.fatherName = 1;
        unsetFields.motherName = 1;
        unsetFields.gender = 1;
        unsetFields.education = 1;
        unsetFields.matrimonyPictures = 1; // Unset matrimony pictures too
    }

    // Construct the full update operation
    const updateOperation: { $set?: any, $unset?: any } = {};
    if (Object.keys(setFields).length > 0) {
      updateOperation.$set = setFields;
    }
    if (Object.keys(unsetFields).length > 0) {
      updateOperation.$unset = unsetFields;
    }

    // Update the user document in MongoDB
    const result = await db.collection<UserDoc>('users').updateOne(
      { _id: new ObjectId(userId) }, // Query by user ID
      updateOperation // Use the constructed update operation
    );

    if (result.matchedCount === 0) {
      console.log(`Update Profile API: User not found for ID ${userId} during update.`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('Update Profile API: MongoDB update result:', result);

    // Respond with success
    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Profile update API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}