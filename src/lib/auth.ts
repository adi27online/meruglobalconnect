// src/lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

// Interface for the decoded JWT payload
interface JwtPayload {
  id: string; // user._id.toString()
  name: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Verifies a JWT token from the Authorization header and returns the user ID.
 * Returns null if token is missing, invalid, or expired.
 */
export const getUserIdFromRequest = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    console.log('No Authorization header found.');
    return null;
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"
  if (!token) {
    console.log('No token found after Bearer.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    return decoded.id; // Return the user ID from the token
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};