// src/app/api/user/volunteer-status/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server'; // Import clerkClient for user management

/**
 * POST handler to update a user's volunteer status in Clerk public metadata.
 * This route is protected by Clerk authentication.
 */
export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized. User not signed in.' }, { status: 401 });
  }

  try {
    const { isVolunteer } = await req.json();

    if (typeof isVolunteer !== 'boolean') {
      return NextResponse.json({ message: 'Invalid input: isVolunteer must be a boolean.' }, { status: 400 });
    }

    // Update the user's public metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        isVolunteer: isVolunteer,
      },
    });

    return NextResponse.json({ message: 'Volunteer status updated successfully.' }, { status: 200 });

  } catch (error) {
    console.error('API Error: Failed to update volunteer status:', error);
    // More specific error handling could be added here based on error type
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}