// src/app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not defined.');
}
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Define your registration fee here (e.g., $10.00)
const REGISTRATION_FEE_AMOUNT_CENTS = 1000; // Amount in cents (e.g., 1000 cents = $10.00)
const CURRENCY = 'usd'; // Or your preferred currency

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user (optional, but good practice to ensure only logged-in users initiate payment)
    // For registration, the user might not be fully logged in yet, but we'll use the userId passed from the frontend.
    // The userId should come from the successful /api/register response.
    const { userId } = await req.json(); // Expect userId from the frontend

    if (!userId || !ObjectId.isValid(userId)) {
      console.log('Create Payment Intent API: User ID is missing or invalid.');
      return NextResponse.json({ error: 'User ID is required to create a payment intent.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/create-payment-intent');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      console.log(`Create Payment Intent API: User not found for ID: ${userId}`);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Prevent creating intent if user is already paid
    if (user.isPaid) {
      console.log(`Create Payment Intent API: User ${userId} is already paid.`);
      return NextResponse.json({ message: 'User is already paid.', clientSecret: 'already_paid' }, { status: 200 });
    }

    // 2. Create a Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: REGISTRATION_FEE_AMOUNT_CENTS,
      currency: CURRENCY,
      metadata: { userId: userId }, // Associate the payment with the user ID
      automatic_payment_methods: { enabled: true }, // Enable automatic payment methods
    });

    console.log(`Payment Intent created for user ${userId}: ${paymentIntent.id}`);

    // 3. Return the client secret to the frontend
    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, { status: 200 });

  } catch (error) {
    console.error('Create Payment Intent API Error:', error);
    let errorMessage = 'Failed to create payment intent.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
