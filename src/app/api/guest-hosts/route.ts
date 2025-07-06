// src/app/api/guest-hosts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// --- Placeholder for your Database / Data Storage ---
// IMPORTANT: In a real application, this would be a database.
// For demonstration, we'll use a simple in-memory array.
// This means data will be LOST every time your Next.js development server restarts.
interface GuestHostOffer {
  id: string;
  hostId: string; // Placeholder for the ID of the user offering the host
  accommodationType: 'spare_room' | 'couch' | 'entire_place' | 'other';
  availableFrom: string; // YYYY-MM-DD
  availableTo: string; // YYYY-MM-DD
  maxGuests: number;
  guestPurpose: 'student' | 'tourist' | 'new_resident' | 'temporary_stay' | 'family_visitor' | 'other' | '';
  hostDescription: string;
  specialConsiderations: string;
  contactEmail: string;
  // --- NEW ADDRESS FIELDS ---
  city: string;
  state: string;
  zip: string;
  country: string;
  // --- END NEW ADDRESS FIELDS ---
  status: 'active' | 'filled' | 'inactive'; // To manage offer status
  createdAt: string; // ISO string
}

// In-memory array to store guest hosting offers. Data will be lost on server restart.
let guestHostOffers: GuestHostOffer[] = [
  {
    id: 'host-1',
    hostId: 'host-user-123',
    accommodationType: 'spare_room',
    availableFrom: '2025-07-15',
    availableTo: '2025-08-15',
    maxGuests: 1,
    guestPurpose: 'student',
    hostDescription: 'Cozy spare room with a desk, good for a student. Shared bathroom. Access to kitchen and living room.',
    specialConsiderations: 'No pets, no smoking.',
    contactEmail: 'host1@example.com',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85001',
    country: 'USA',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'host-2',
    hostId: 'host-user-456',
    accommodationType: 'couch',
    availableFrom: '2025-08-01',
    availableTo: '2025-08-07',
    maxGuests: 1,
    guestPurpose: 'tourist',
    hostDescription: 'Comfy couch in living room. Perfect for a short-term tourist. Close to downtown.',
    specialConsiderations: 'Must be comfortable with a friendly cat.',
    contactEmail: 'host2@example.com',
    city: 'Tempe',
    state: 'AZ',
    zip: '85281',
    country: 'USA',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Handles GET requests to /api/guest-hosts.
 * Fetches all active guest hosting offers.
 * @returns NextResponse with a JSON array of GuestHostOffer objects.
 */
export async function GET() {
  const activeOffers = guestHostOffers.filter(offer =>
    offer.status === 'active' && new Date(offer.availableTo) >= new Date()
  ).sort((a, b) => {
    return new Date(a.availableFrom).getTime() - new Date(b.availableFrom).getTime();
  });
  return NextResponse.json(activeOffers);
}

/**
 * Handles POST requests to /api/guest-hosts.
 * Receives new guest hosting offer data, validates it, and stores it.
 * @param req The NextRequest object containing the request body.
 * @returns NextResponse with success message and the new offer, or an error.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      accommodationType,
      availableFrom,
      availableTo,
      maxGuests,
      guestPurpose,
      hostDescription,
      specialConsiderations,
      contactEmail,
      // --- NEW ADDRESS FIELDS ---
      city,
      state,
      zip,
      country,
      // --- END NEW ADDRESS FIELDS ---
    } = await req.json();

    // Basic validation (updated to include new fields)
    if (!accommodationType || !availableFrom || !availableTo || !maxGuests || !contactEmail || !city || !state || !zip || !country) {
      return NextResponse.json(
        { message: 'Missing required fields. Please fill in all accommodation, date, guest, contact, and address details.' },
        { status: 400 } // Bad Request status
      );
    }

    // Date validation
    if (new Date(availableFrom) > new Date(availableTo)) {
      return NextResponse.json(
        { message: 'Available From date cannot be after Available To date.' },
        { status: 400 }
      );
    }
    if (new Date(availableFrom) < new Date().setHours(0,0,0,0)) {
        return NextResponse.json(
            { message: 'Available From date cannot be in the past.' },
            { status: 400 }
        );
    }

    const authorizationHeader = req.headers.get('Authorization');
    const token = authorizationHeader?.split(' ')[1];
    const hostId = token ? 'authenticated-host-id' : 'guest-host-id';

    const newOffer: GuestHostOffer = {
      id: uuidv4(),
      hostId,
      accommodationType,
      availableFrom,
      availableTo,
      maxGuests: Number(maxGuests),
      guestPurpose: guestPurpose || '',
      hostDescription: hostDescription || '',
      specialConsiderations: specialConsiderations || '',
      contactEmail,
      // --- NEW ADDRESS FIELDS ---
      city,
      state,
      zip,
      country,
      // --- END NEW ADDRESS FIELDS ---
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    guestHostOffers.push(newOffer);

    return NextResponse.json({ message: 'Guest hosting offer submitted successfully!', offer: newOffer }, { status: 201 });

  } catch (error) {
    console.error('Error processing guest host offer post:', error);
    return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
  }
}