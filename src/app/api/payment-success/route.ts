// src/app/api/payment-success/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/db';
import { Db, ObjectId } from 'mongodb';
import { UserDoc } from '@/types/user';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not defined.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database in /api/payment-success');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const usersCollection = db.collection<UserDoc>('users');

    // 1. Retrieve the Payment Intent from Stripe to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      console.log(`Payment Intent ${paymentIntentId} status is not succeeded: ${paymentIntent.status}`);
      return NextResponse.json({ error: `Payment not successful. Status: ${paymentIntent.status}` }, { status: 400 });
    }

    // 2. Extract userId from metadata
    const userId = paymentIntent.metadata?.userId;
    if (!userId || !ObjectId.isValid(userId)) {
      console.error(`Payment Intent ${paymentIntentId} missing or invalid userId in metadata.`);
      return NextResponse.json({ error: 'User ID not found in payment metadata.' }, { status: 400 });
    }

    // 3. Update the user's isPaid status in your database
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isPaid: true } }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(`Payment Success API: User not found for ID ${userId} during isPaid update.`);
      return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
    }
    if (updateResult.modifiedCount === 0) {
      console.log(`Payment Success API: User ${userId} was already marked as paid.`);
      return NextResponse.json({ message: 'Payment already processed for this user.' }, { status: 200 });
    }

    console.log(`User ${userId} successfully marked as paid.`);
    return NextResponse.json({ message: 'Payment confirmed and registration completed!' }, { status: 200 });

  } catch (error) {
    console.error('Payment Success API Error:', error);
    let errorMessage = 'Internal server error during payment confirmation.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
