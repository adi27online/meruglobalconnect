// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken'; // For JWT verification
import { connectDB } from '@/lib/db'; // Path to your dbConnect utility
import { Db, ObjectId } from 'mongodb'; // MongoDB Db and ObjectId types
import { UserDoc } from '@/types/user'; // User interface for type safety

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Please set it in your .env.local file.');
}

export async function GET(req: NextRequest) {
  await connectDB(); // Ensure connection to the database

  try {
    // 1. Get the JWT token from the Authorization header
    // The header typically looks like "Bearer YOUR_TOKEN_STRING"
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    // If no token is provided in the header, return 401 Unauthorized
    if (!token) {
      console.log('Profile API: No token provided'); // Added log
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // 2. Verify the token and decode its payload
    let decoded: { id: string; name: string; email: string; } | null = null;
    try {
      // jwt.verify will throw an error if the token is invalid or expired
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string; email: string; };
    } catch (error) {
      // If token verification fails, return 401 Unauthorized
      console.error('Profile API: Token verification failed:', error); // Added log
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get the user ID from the decoded token payload
    const userId = decoded.id; 

    // If for some reason the userId is missing from the token, return 401
    if (!userId) {
      console.log('Profile API: User ID not found in token'); // Added log
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const db: Db = await connectDB(); // Get the database instance
    // Safety check for database connection
    if (!db) {
      console.error('Failed to connect to database in /api/user/profile');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 3. Find the user in the database using the ID from the token
    // Convert the string userId back to MongoDB's ObjectId type for the query
    const user = await db.collection<UserDoc>('users').findOne({ _id: new ObjectId(userId) });

    // If user is not found in the database (e.g., deleted account)
    if (!user) {
      console.log(`Profile API: User not found for ID: ${userId}`); // Added log
      return NextResponse.json({ error: 'User not found' }, { status: 404 }); // 404 Not Found
    }

    // 4. Return selected user profile data to the frontend
    // Important: DO NOT return sensitive data like the hashed password
    const userProfile = {
      _id: user._id.toString(), // Convert ObjectId to string for consistency on frontend
      name: user.name,
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      
      email: user.email,
      bio: user.bio || '', 
      profession: user.profession || '', 
      hobbies: user.hobbies || [], 
      profilePicture: user.profilePicture || '', 
      spouse: user.spouse || undefined, 
      children: user.children || [],     
      isMatrimonyEnabled: user.isMatrimonyEnabled || false, 

      // NEW: Include all matrimony-specific details
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : '', // Convert Date to ISO string for frontend
      timeOfBirth: user.timeOfBirth || '',
      placeOfBirth: user.placeOfBirth || '',
      fatherName: user.fatherName || '',
      motherName: user.motherName || '',
      gender: user.gender || '',
      education: user.education || '',
      matrimonyPictures: user.matrimonyPictures || [], // Ensure this is an array
    };

    console.log('Profile API: User profile fetched and sent:', userProfile); // Added log
    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    // Catch any unexpected server-side errors
    console.error('User profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // 500 Internal Server Error
  }
}