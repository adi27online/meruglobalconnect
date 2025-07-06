// src/app/api/resend-verification-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user';
import crypto from 'crypto';
import { sendEmail } from '@/lib/sendEmail'; // Ensure this utility is available

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/resend-verification-email');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // Find the user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      // For security reasons, don't reveal if the email doesn't exist.
      // Return a generic success message to prevent enumeration attacks.
      console.log(`Resend Verification API: Attempt to resend email for non-existent user: ${email}`);
      return NextResponse.json({ message: 'If an account with that email exists and is unverified, a new verification email has been sent.' }, { status: 200 });
    }

    // If the user is already verified, inform them
    if (user.isVerified) {
      console.log(`Resend Verification API: User ${email} is already verified.`);
      return NextResponse.json({ message: 'Your email is already verified. You can now log in.' }, { status: 200 });
    }

    // Generate a new verification token and expiry
    const newEmailVerificationToken = crypto.randomBytes(32).toString('hex');
    const newEmailVerificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update the user's document with the new token and expiry
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: newEmailVerificationToken,
          emailVerificationTokenExpires: newEmailVerificationTokenExpires,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error(`Resend Verification API: User ${user._id} not modified during token update.`);
      return NextResponse.json({ error: 'Failed to update verification token.' }, { status: 500 });
    }

    // Send the new verification email
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${newEmailVerificationToken}`;
    const emailRes = await sendEmail({
      to: email,
      subject: 'Resend: Verify your email for MyCommunity',
      html: `<p>Dear ${user.name},</p>
             <p>You recently requested to resend your email verification link for MyCommunity. Please click the link below to verify your email address:</p>
             <p><a href="${verificationLink}">Verify My Email Address</a></p>
             <p>This link will expire in 1 hour.</p>
             <p>If you did not request this, please ignore this email.</p>
             <p>Best regards,<br/>The MyCommunity Team</p>`,
    });

    if (!emailRes.success) {
      console.error(`Failed to send resend verification email to ${email}: ${emailRes.message}`);
      return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 });
    }

    console.log(`New verification email successfully sent to ${email}`);
    return NextResponse.json({ message: 'A new verification email has been sent to your inbox. Please check your email.' }, { status: 200 });

  } catch (error) {
    console.error('Resend Verification Email API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}