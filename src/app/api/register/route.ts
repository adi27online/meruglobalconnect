// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { Db } from 'mongodb';
import { UserDoc } from '@/types/user'; 
import crypto from 'crypto'; // Import crypto for token generation
import { sendEmail } from '@/lib/sendEmail'; // Import sendEmail utility (now using Resend)

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/register');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      // If user exists but is not paid and not verified, allow re-registration to trigger payment/verification
      if (!existingUser.isPaid || !existingUser.isVerified) {
        // Optionally, you could update their token and resend email/redirect to payment
        // For now, we'll just inform them they need to complete registration.
        return NextResponse.json({ 
          error: 'An account with this email already exists. Please complete your registration (verify email and/or make payment) or log in.',
          requiresPayment: !existingUser.isPaid, // Indicate if payment is still pending
          userId: existingUser._id.toString() // Pass user ID for redirection to payment
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'User with this email already exists and is fully registered.' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    // Generate a unique email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // Define the new user object without _id, as MongoDB will generate it
    const newUser: Omit<UserDoc, '_id'> = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isVerified: false, // User is unverified by default
      emailVerificationToken,
      emailVerificationTokenExpires,
      isPaid: false, // NEW: User is unpaid by default
    };

    // Fix: Use type assertion to tell TypeScript that `newUser` will conform to `UserDoc`
    // after MongoDB assigns an _id upon insertion.
    const result = await usersCollection.insertOne(newUser as UserDoc); 
    const newUserId = result.insertedId.toString();

    // Send the actual email using the Resend-integrated sendEmail utility
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${emailVerificationToken}`;
    const emailRes = await sendEmail({
      to: email,
      subject: 'Verify your email for MyCommunity',
      html: `<p>Dear ${name},</p>
            <p>Thank you for registering with MyCommunity. Please click the link below to verify your email address:</p>
            <p><a href="${verificationLink}">Verify My Email Address</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not register for this service, please ignore this email.</p>
            <p>Best regards,<br/>The MyCommunity Team</p>`,
    });

    if (!emailRes.success) {
      console.error(`Failed to send verification email to ${email}: ${emailRes.message}`);
      // Decide if you want to return an error to the user or proceed despite email sending failure
      // For now, we'll still return success for registration but log the email error.
      // In a production app, you might want a retry mechanism or a more robust error handling.
    } else {
      console.log(`Verification email successfully queued for ${email}`);
    }

    // Indicate that registration is pending payment
    return NextResponse.json(
      { 
        message: 'Registration successful! Please proceed to payment to complete your account. A verification email has also been sent.',
        requiresPayment: true,
        userId: newUserId, // Pass new user ID for payment redirection
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
