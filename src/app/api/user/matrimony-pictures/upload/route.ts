// src/app/api/user/matrimony-pictures/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';
import { Db, ObjectId } from 'mongodb';
import { connectDB } from '@/lib/db';
import { UserDoc } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

export const config = {
  api: {
    bodyParser: false, // Required for Next.js to not parse the body as JSON, allowing FormData handling
  },
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('Matrimony Pictures Upload API: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
    } catch (error) {
      console.error('Matrimony Pictures Upload API: Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.id;
    if (!userId) {
      console.log('Matrimony Pictures Upload API: User ID not found in token');
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    // 2. Parse the incoming FormData to get all files
    const formData = await req.formData();
    const uploadedFiles: File[] = [];
    
    // Iterate over all entries to find files named 'matrimonyImages'
    for (const [key, value] of formData.entries()) {
      if (key === 'matrimonyImages' && value instanceof Blob) { // Check if it's a Blob (File is a Blob)
        uploadedFiles.push(value as File);
      }
    }

    if (uploadedFiles.length === 0) {
      console.log('Matrimony Pictures Upload API: No image files uploaded.');
      return NextResponse.json({ error: 'No image files uploaded.' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'matrimony'); // Dedicated folder
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log('Matrimony Pictures Upload API: Upload directory ensured:', uploadDir);
    } catch (dirError) {
      console.error('Matrimony Pictures Upload API: Failed to create upload directory:', dirError);
      return NextResponse.json({ error: 'Server error: Could not create upload directory.' }, { status: 500 });
    }

    const db: Db = await connectDB();
    if (!db) {
        console.error('Failed to connect to database for matrimony pictures upload.');
        return NextResponse.json({ error: 'Database connection failed.' }, { status: 500 });
    }
    const usersCollection = db.collection<UserDoc>('users');

    // Fetch existing matrimony pictures to append new ones
    const currentUser = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { matrimonyPictures: 1 } }
    );
    let existingMatrimonyPictures = currentUser?.matrimonyPictures || [];


    // Process each uploaded file
    for (const file of uploadedFiles) {
      // Basic file validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (!allowedTypes.includes(file.type)) {
        console.log('Matrimony Pictures Upload API: Invalid file type:', file.type);
        continue; // Skip this file, but continue with others
      }
      if (file.size > maxSize) {
        console.log('Matrimony Pictures Upload API: File size too large:', file.size);
        continue; // Skip this file
      }

      const fileExtension = path.extname(file.name);
      // Use user ID and a timestamp for a unique filename for each image
      const uniqueFilename = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExtension}`; 
      const filePath = path.join(uploadDir, uniqueFilename);
      const publicUrl = `/uploads/matrimony/${uniqueFilename}`; // Publicly accessible URL

      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        await fs.writeFile(filePath, buffer);
        uploadedUrls.push(publicUrl); // Add successfully uploaded file's URL
      } catch (writeError) {
        console.error('Matrimony Pictures Upload API: Failed to write file:', writeError);
        // Continue to next file even if one fails
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: 'No valid images were uploaded or saved.' }, { status: 400 });
    }

    // 6. Update the user's matrimonyPictures field in MongoDB
    // We use $addToSet to add new unique URLs, but here we want to replace/append the array
    // Since we're fetching existing and adding, we'll use $set to put the new combined array.
    const newMatrimonyPictures = [...existingMatrimonyPictures, ...uploadedUrls];
    
    // Optional: Add a limit to the number of pictures a user can upload
    // if (newMatrimonyPictures.length > 10) { // Example limit
    //   // Handle too many pictures, e.g., return an error or truncate
    // }

    const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { matrimonyPictures: newMatrimonyPictures } } // Set the entire array
    );

    if (updateResult.matchedCount === 0) {
        console.warn(`Matrimony Pictures Upload API: No user found for ID ${userId} during matrimonyPictures update.`);
        return NextResponse.json({ error: 'User not found for update after file upload.' }, { status: 404 });
    }

    console.log(`Matrimony Pictures Upload API: Successfully uploaded ${uploadedUrls.length} images for user ${userId}.`);
    return NextResponse.json({ imageUrls: uploadedUrls, message: 'Files uploaded successfully' }, { status: 200 });

  } catch (error) {
    console.error('Matrimony Pictures Upload API: General error during upload:', error);
    return NextResponse.json({ error: 'Internal server error during upload.' }, { status: 500 });
  }
}