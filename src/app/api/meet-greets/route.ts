// src/app/api/meet-greets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// --- Placeholder for your Database / Data Storage ---
// IMPORTANT: In a real application, this would be a database (e.g., MongoDB, PostgreSQL, Firestore).
// For demonstration purposes, we are using a simple in-memory array.
// This means data will be LOST every time your Next.js development server restarts.
interface MeetGreetEvent {
  id: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD format
  eventTime: string; // HH:MM format
  location: string;
  description: string;
  createdAt: string; // ISO string format (e.g., "2025-07-05T16:30:00.000Z")
  createdBy: string; // User ID of the creator (placeholder for now)
}

// In-memory array to store events. Data will be lost on server restart.
let meetGreetEvents: MeetGreetEvent[] = [
  {
    id: 'meet-greet-1',
    eventName: 'Community Potluck Picnic',
    eventDate: '2025-07-20',
    eventTime: '12:00',
    location: 'Freestone Park, Gilbert',
    description: 'Bring your favorite dish and join us for a fun potluck picnic at Freestone Park! A great chance to meet new neighbors.',
    createdAt: new Date().toISOString(),
    createdBy: 'admin-user-id',
  },
  {
    id: 'meet-greet-2',
    eventName: 'Coffee & Chat Morning',
    eventDate: '2025-08-01',
    eventTime: '09:30',
    location: 'Local Grind Coffee Shop',
    description: 'Casual morning coffee to connect and chat. All community members welcome!',
    createdAt: new Date().toISOString(),
    createdBy: 'user-456',
  },
];

/**
 * Handles GET requests to /api/meet-greets.
 * Fetches all stored meet & greet events.
 * Events are sorted by date and time, with upcoming events appearing first.
 * @returns NextResponse with a JSON array of MeetGreetEvent objects.
 */
export async function GET() {
  // Sort events by date and time, upcoming first
  const sortedEvents = meetGreetEvents.sort((a, b) => {
    const dateTimeA = new Date(`${a.eventDate}T${a.eventTime}`);
    const dateTimeB = new Date(`${b.eventDate}T${b.eventTime}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });
  return NextResponse.json(sortedEvents);
}

/**
 * Handles POST requests to /api/meet-greets.
 * Receives new meet & greet event data, validates it, and stores it.
 * @param req The NextRequest object containing the request body.
 * @returns NextResponse with success message and the new event, or an error.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body from the request
    const { eventName, eventDate, eventTime, location, description } = await req.json();

    // Basic validation to ensure required fields are present
    if (!eventName || !eventDate || !eventTime || !location) {
      return NextResponse.json(
        { message: 'Missing required fields: eventName, eventDate, eventTime, or location.' },
        { status: 400 } // Bad Request status
      );
    }

    // In a real application, you would:
    // 1. Validate the user's authentication token (e.g., JWT).
    // 2. Extract the actual user ID from the validated token.
    // For this example, we're using a dummy user ID based on token presence.
    const authorizationHeader = req.headers.get('Authorization');
    const token = authorizationHeader?.split(' ')[1]; // Expects "Bearer TOKEN" format
    const createdBy = token ? 'authenticated-user-id' : 'guest-user-id'; // Placeholder user ID

    // Create a new MeetGreetEvent object
    const newEvent: MeetGreetEvent = {
      id: uuidv4(), // Generate a unique ID for the event
      eventName,
      eventDate,
      eventTime,
      location,
      description: description || '', // Description is optional, default to empty string
      createdAt: new Date().toISOString(), // Record the creation timestamp
      createdBy, // Assign the creator's ID
    };

    // In a real application, you would save `newEvent` to your persistent database here.
    // For this demonstration, we add it to the in-memory array.
    meetGreetEvents.push(newEvent);

    // Return a success response with the newly created event
    return NextResponse.json(
      { message: 'Meet & Greet planned successfully!', event: newEvent },
      { status: 201 } // 201 Created status
    );

  } catch (error) {
    // Log the error for debugging purposes on the server
    console.error('Error processing meet & greet post:', error);
    // Return a generic internal server error response to the client
    return NextResponse.json(
      { message: 'Internal server error.', error: (error as Error).message },
      { status: 500 } // 500 Internal Server Error status
    );
  }
}