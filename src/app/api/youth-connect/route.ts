// src/app/api/youth-connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Define the interface for YouthConnectEntry
interface YouthConnectEntry {
  id: string;
  submitterId: string;
  name: string;
  ageRange: string;
  interests: string;
  contactEmail: string;
  type: 'individual' | 'group' | 'activity' | 'other';
  description: string;
  location?: string; // Optional field, mainly for groups/activities
  // --- NEW FIELDS FOR INDIVIDUAL YOUTH PROFILES ---
  grade?: string;
  hobbies?: string;
  achievements?: string;
  pictureUrl?: string; // URL to a profile picture
  awards?: string;
  extraCurricularActivities?: string;
  sports?: string;
  school?: string;
  // --- END NEW FIELDS ---
  createdAt: string;
}

// In-memory array for demonstration. Data will be lost on server restart.
let youthConnectEntries: YouthConnectEntry[] = [
  {
    id: 'yc-1',
    submitterId: 'user-001',
    name: 'Sarah M.',
    ageRange: '11-14',
    interests: 'reading, drawing, anime',
    contactEmail: 'sarah.m.contact@example.com',
    type: 'individual',
    description: 'Looking for other kids interested in starting a book club or art group.',
    location: 'Online / Library', // Even for individual, they might specify preferred meeting location
    grade: '8th Grade',
    hobbies: 'digital art, creative writing, piano',
    achievements: 'School Art Contest Winner, Perfect Attendance',
    pictureUrl: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Sarah', // Example placeholder image
    awards: 'Honor Roll 2024',
    extraCurricularActivities: 'School Newspaper, Robotics Club',
    sports: 'Volleyball (club)',
    school: 'Northwood Middle School',
    createdAt: new Date('2025-06-28T10:00:00Z').toISOString(),
  },
  {
    id: 'yc-2',
    submitterId: 'user-002',
    name: 'Community Robotics Club',
    ageRange: '15-18',
    interests: 'robotics, coding, engineering, STEM',
    contactEmail: 'robotics@community.org',
    type: 'group',
    description: 'Our club meets weekly to build and program robots for local competitions. All skill levels welcome!',
    location: 'Community Center, Room 101',
    createdAt: new Date('2025-06-25T14:30:00Z').toISOString(),
  },
  {
    id: 'yc-3',
    submitterId: 'user-003',
    name: 'Summer Soccer Camp',
    ageRange: '6-10',
    interests: 'soccer, sports, fitness',
    contactEmail: 'soccercamp@email.com',
    type: 'activity',
    description: 'Fun and engaging soccer camp for kids this summer. Learn skills, teamwork, and have a blast!',
    location: 'Central Park Soccer Fields',
    createdAt: new Date('2025-07-01T09:00:00Z').toISOString(),
  },
];

/**
 * Handles GET requests to /api/youth-connect.
 * Fetches all youth connect entries.
 * @returns NextResponse with a JSON array of YouthConnectEntry objects.
 */
export async function GET() {
  const sortedEntries = youthConnectEntries.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return NextResponse.json(sortedEntries);
}

/**
 * Handles POST requests to /api/youth-connect.
 * Receives new youth connect entry data, validates it, and stores it.
 * @param req The NextRequest object containing the request body.
 * @returns NextResponse with success message and the new entry, or an error.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      name,
      ageRange,
      interests,
      contactEmail,
      type,
      description,
      location,
      // --- NEW FIELDS ---
      grade,
      hobbies,
      achievements,
      pictureUrl,
      awards,
      extraCurricularActivities,
      sports,
      school,
      // --- END NEW FIELDS ---
    } = await req.json();

    // Basic validation
    if (!name || !ageRange || !contactEmail || !type || !description) {
      return NextResponse.json(
        { message: 'Missing required fields: name, age range, contact email, type, or description.' },
        { status: 400 }
      );
    }

    const authorizationHeader = req.headers.get('Authorization');
    const token = authorizationHeader?.split(' ')[1];
    const submitterId = token ? 'authenticated-user-id' : 'anonymous-user-id'; // Replace with actual user ID logic

    const newEntry: YouthConnectEntry = {
      id: uuidv4(),
      submitterId,
      name,
      ageRange,
      interests: interests || '',
      contactEmail,
      type,
      description,
      location: location || '',
      createdAt: new Date().toISOString(),
      // --- Assign new fields (they will be undefined if not provided in payload) ---
      grade: grade || undefined,
      hobbies: hobbies || undefined,
      achievements: achievements || undefined,
      pictureUrl: pictureUrl || undefined,
      awards: awards || undefined,
      extraCurricularActivities: extraCurricularActivities || undefined,
      sports: sports || undefined,
      school: school || undefined,
    };

    youthConnectEntries.push(newEntry);

    return NextResponse.json({ message: 'Youth Connect entry submitted successfully!', entry: newEntry }, { status: 201 });

  } catch (error) {
    console.error('Error processing youth connect post:', error);
    return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
  }
}