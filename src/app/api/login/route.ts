// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Db } from 'mongodb';
import { UserDoc } from '@/types/user';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db: Db = await connectDB();
    const usersCollection = db.collection<UserDoc>('users');
    const user = await usersCollection.findOne({ email });

    if (!user) {
      // Do not reveal which part is incorrect for security
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 1. Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json({
        error: 'Please verify your email address before logging in.',
        emailNotVerified: true,
      }, { status: 403 });
    }

    // 2. Check password
    if (!user.password || !(await compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 3. Create JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
