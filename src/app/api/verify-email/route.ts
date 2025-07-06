// src/app/api/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user';

export async function GET(req: NextRequest) { // Changed to GET method
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is missing.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/verify-email');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Find the user with the matching token and ensure it's not expired
    const user = await usersCollection.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      console.log(`Email verification failed: Invalid or expired token provided: ${token}`);
      return NextResponse.json(
        { error: 'Invalid or expired verification token. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark the user as verified and clear the token fields
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { emailVerificationToken: '', emailVerificationTokenExpires: '' }, // Remove token fields
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error(`Failed to update user ${user._id} to verified status.`);
      return NextResponse.json({ error: 'Failed to verify email. Please try again.' }, { status: 500 });
    }

    console.log(`User ${user.email} successfully verified!`);
    return NextResponse.json({ message: 'Email verified successfully! You can now log in.' }, { status: 200 });

  } catch (error) {
    console.error('Email Verification API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}