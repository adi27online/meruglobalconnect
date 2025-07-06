// src/app/api/upload-profile-pic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs'; // Node.js File System module for file operations
import path from 'path'; // Node.js Path module for path manipulation
import { Db, ObjectId } from 'mongodb'; // Import Db and ObjectId for potential future database updates
import { connectDB } from '@/lib/db'; // Import your DB connection utility

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined. Set it in .env.local.');
}

// Set this to false to allow file uploads. Next.js App Router defaults to JSON parsing.
// We need to tell it not to parse the body as JSON, so we can handle FormData.
export const config = {
  api: {
    bodyParser: false, // Deprecated in Next.js 13+ App Router. This setting isn't directly used.
                        // For App Router, `req.formData()` is the correct way to handle multipart.
  },
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user from the token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('Upload Profile Pic API: No token provided'); // Added log
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: { id: string; email: string; } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; };
      console.log('Upload Profile Pic API: Token decoded for userId:', decoded.id); // Added log
    } catch (error) {
      console.error('Upload Profile Pic API: Token verification failed:', error); // Added log
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.id;
    if (!userId) {
      console.log('Upload Profile Pic API: User ID not found in token'); // Added log
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    // 2. Parse the incoming FormData
    const formData = await req.formData();
    const profileImage = formData.get('profileImage') as File; // Get the file from FormData

    if (!profileImage) {
      console.log('Upload Profile Pic API: No image file uploaded.'); // Added log
      return NextResponse.json({ error: 'No image file uploaded.' }, { status: 400 });
    }

    // Basic file validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(profileImage.type)) {
      console.log('Upload Profile Pic API: Invalid file type:', profileImage.type); // Added log
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, GIF allowed.' }, { status: 400 });
    }
    if (profileImage.size > maxSize) {
      console.log('Upload Profile Pic API: File size too large:', profileImage.size); // Added log
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    // 3. Define the upload directory and create it if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true }); // Create directory recursively
      console.log('Upload Profile Pic API: Upload directory ensured:', uploadDir); // Added log
    } catch (dirError) {
      console.error('Upload Profile Pic API: Failed to create upload directory:', dirError); // Added log
      return NextResponse.json({ error: 'Server error: Could not create upload directory.' }, { status: 500 });
    }


    // 4. Generate a unique filename
    const fileExtension = path.extname(profileImage.name);
    const uniqueFilename = `${userId}-${Date.now()}${fileExtension}`; // User ID + timestamp for uniqueness
    const filePath = path.join(uploadDir, uniqueFilename);
    const publicUrl = `/uploads/${uniqueFilename}`; // Publicly accessible URL

    // 5. Write the file to the filesystem
    // Convert the File object to a Buffer
    const buffer = Buffer.from(await profileImage.arrayBuffer());
    try {
      await fs.writeFile(filePath, buffer);
      console.log('Upload Profile Pic API: File written to:', filePath); // Added log
    } catch (writeError) {
      console.error('Upload Profile Pic API: Failed to write file:', writeError); // Added log
      return NextResponse.json({ error: 'Server error: Could not save image file.' }, { status: 500 });
    }


    // Optional: Update the user's profilePicture field in MongoDB
    // This connects to the database and updates the user's document
    try {
      const db: Db = await connectDB();
      if (db) {
        const updateResult = await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { profilePicture: publicUrl } }
        );
        console.log(`Upload Profile Pic API: User ${userId} profilePicture DB update result:`, updateResult); // Added log
        if (updateResult.matchedCount === 0) {
            console.warn(`Upload Profile Pic API: No user found for ID ${userId} during profilePicture update.`);
        }
      } else {
          console.error('Upload Profile Pic API: DB connection not available for profile picture update.');
      }
    } catch (dbError) {
      console.error('Upload Profile Pic API: Failed to update user profilePicture in DB:', dbError);
      // Don't fail the file upload request itself if DB update fails, just log it.
    }

    // 6. Respond with the URL of the uploaded image
    return NextResponse.json({ imageUrl: publicUrl, message: 'File uploaded successfully' }, { status: 200 });

  } catch (error) {
    console.error('Upload Profile Pic API: General error during upload:', error); // Added general error log
    return NextResponse.json({ error: 'Internal server error during upload.' }, { status: 500 });
  }
}