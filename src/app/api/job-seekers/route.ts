// src/app/api/job-seekers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os'; // For getting temp directory
import jwt from 'jsonwebtoken'; // For token verification

// Define the interface for JobSeekerProfile
interface JobSeekerProfile {
  id: string;
  userId: string; // ID of the user who owns this profile
  fullName: string;
  location: string;
  contactEmail: string;
  phoneNumber?: string;
  education: Array<{
    degree: string;
    fieldOfStudy: string;
    institution: string;
    location?: string;
    graduationDate: string; // YYYY-MM
    description?: string;
  }>;
  experience: Array<{
    jobTitle: string;
    companyName: string;
    location?: string;
    employmentType?: string;
    startDate: string; // YYYY-MM
    endDate?: string; // YYYY-MM or undefined if current
    description: string;
  }>;
  skills: string[]; // Array of strings, e.g., ['Python', 'Project Management']
  resumeUrl?: string; // URL to the uploaded resume
  createdAt: string;
  updatedAt: string;
}

// In-memory data store for demonstration. Data will be lost on server restart.
// In a real app, this would be a database.
let jobSeekerProfiles: JobSeekerProfile[] = [
  {
    id: 'seeker-1',
    userId: 'user1', // Corresponds to test@example.com in your auth system
    fullName: 'Alice Wonderland',
    location: 'Gilbert, AZ, USA',
    contactEmail: 'alice.w@example.com',
    phoneNumber: '+14801234567',
    education: [
      {
        degree: 'B.S.',
        fieldOfStudy: 'Computer Science',
        institution: 'Arizona State University',
        location: 'Tempe, AZ',
        graduationDate: '2022-05',
        description: 'Graduated with honors, GPA: 3.9/4.0',
      },
    ],
    experience: [
      {
        jobTitle: 'Software Engineer',
        companyName: 'Tech Innovations Inc.',
        location: 'Phoenix, AZ',
        startDate: '2022-06',
        endDate: '2024-06',
        description: 'Developed and maintained backend services using Node.js and AWS. Implemented new features and optimized existing code.',
      },
    ],
    skills: ['JavaScript', 'Node.js', 'React', 'AWS', 'SQL', 'Git'],
    resumeUrl: 'https://placehold.co/200x100/FF5733/FFFFFF?text=Resume-Alice', // Placeholder for resume URL
    createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-06-01T15:30:00Z').toISOString(),
  },
  {
    id: 'seeker-2',
    userId: 'user2', // Corresponds to user@connect.com in your auth system
    fullName: 'Bob Builder',
    location: 'Chandler, AZ, USA',
    contactEmail: 'bob.b@example.com',
    phoneNumber: '+14809876543',
    education: [
      {
        degree: 'Associate Degree',
        fieldOfStudy: 'Construction Management',
        institution: 'Chandler Community College',
        location: 'Chandler, AZ',
        graduationDate: '2020-12',
        description: '',
      },
    ],
    experience: [
      {
        jobTitle: 'Construction Foreman',
        companyName: 'Build It Right Co.',
        location: 'Gilbert, AZ',
        startDate: '2021-01',
        endDate: undefined, // Currently working here
        description: 'Managed teams of 10-15 workers on residential and commercial projects. Ensured project completion on time and within budget.',
      },
    ],
    skills: ['Project Management', 'Blueprint Reading', 'Team Leadership', 'Safety Compliance'],
    resumeUrl: 'https://placehold.co/200x100/3366FF/FFFFFF?text=Resume-Bob', // Placeholder for resume URL
    createdAt: new Date('2024-02-20T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-01T09:00:00Z').toISOString(),
  },
];

// Directory for resume uploads. Files will be served from /public/resumes
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'resumes');

// Ensure the upload directory exists
async function ensureUploadDirExists() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create resume upload directory:', error);
  }
}
ensureUploadDirExists(); // Call once on server start

// Helper to extract user ID from token (actual JWT verification needed)
function getUserIdFromToken(token: string): string | null {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return null; // Or throw an error in production
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}

/**
 * Handles GET requests to /api/job-seekers.
 * Fetches all job seeker profiles.
 * (In a real app, typically only admins or specific roles would get all profiles)
 * @returns NextResponse with a JSON array of JobSeekerProfile objects.
 */
export async function GET() {
  return NextResponse.json(jobSeekerProfiles);
}

/**
 * Handles GET requests to /api/job-seekers/profile.
 * Fetches a single job seeker profile for the authenticated user.
 * @returns NextResponse with a JSON JobSeekerProfile object or 404 if not found.
 */
export async function GET_PROFILE(req: NextRequest) {
  const authorizationHeader = req.headers.get('Authorization');
  const token = authorizationHeader?.split(' ')[1];
  const userId = token ? getUserIdFromToken(token) : null;

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const profile = jobSeekerProfiles.find(p => p.userId === userId);

  if (!profile) {
    return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

/**
 * Handles POST requests to /api/job-seekers.
 * Creates a new job seeker profile or updates an existing one for the authenticated user.
 * Expects FormData for file uploads.
 * @returns NextResponse with success message and the created/updated profile.
 */
export async function POST(req: NextRequest) {
  const authorizationHeader = req.headers.get('Authorization');
  const token = authorizationHeader?.split(' ')[1];
  const userId = token ? getUserIdFromToken(token) : null;

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const fullName = formData.get('fullName') as string;
    const location = formData.get('location') as string;
    const contactEmail = formData.get('contactEmail') as string;
    const phoneNumber = formData.get('phoneNumber') as string | undefined;
    const educationStr = formData.get('education') as string;
    const experienceStr = formData.get('experience') as string;
    const skillsStr = formData.get('skills') as string;
    const resumeFile = formData.get('resume') as File | null;

    if (!fullName || !location || !contactEmail || !educationStr || !experienceStr || !skillsStr) {
      return NextResponse.json({ message: 'Missing required profile fields' }, { status: 400 });
    }

    let education;
    try {
      education = JSON.parse(educationStr);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid education data format' }, { status: 400 });
    }

    let experience;
    try {
      experience = JSON.parse(experienceStr);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid experience data format' }, { status: 400 });
    }

    let skills;
    try {
      skills = JSON.parse(skillsStr);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid skills data format' }, { status: 400 });
    }

    let resumeUrl: string | undefined;
    if (resumeFile) {
      // Basic file type and size validation
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(resumeFile.type)) {
        return NextResponse.json({ message: 'Invalid file type. Only PDF and DOCX are allowed.' }, { status: 400 });
      }
      if (resumeFile.size > maxFileSize) {
        return NextResponse.json({ message: 'File size exceeds 5MB limit.' }, { status: 400 });
      }

      // Save file to public/resumes
      const filename = `${userId}-${uuidv4()}-${resumeFile.name}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      const fileBytes = await resumeFile.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(fileBytes));
      resumeUrl = `/resumes/${filename}`; // Public URL for the resume
    }

    const now = new Date().toISOString();
    const existingProfileIndex = jobSeekerProfiles.findIndex(p => p.userId === userId);

    let profile: JobSeekerProfile;

    if (existingProfileIndex > -1) {
      // Update existing profile
      profile = {
        ...jobSeekerProfiles[existingProfileIndex],
        fullName,
        location,
        contactEmail,
        phoneNumber,
        education,
        experience,
        skills,
        resumeUrl: resumeUrl || jobSeekerProfiles[existingProfileIndex].resumeUrl, // Keep old URL if no new resume
        updatedAt: now,
      };
      jobSeekerProfiles[existingProfileIndex] = profile;
      return NextResponse.json({ message: 'Profile updated successfully!', profile });
    } else {
      // Create new profile
      profile = {
        id: uuidv4(),
        userId,
        fullName,
        location,
        contactEmail,
        phoneNumber,
        education,
        experience,
        skills,
        resumeUrl,
        createdAt: now,
        updatedAt: now,
      };
      jobSeekerProfiles.push(profile);
      return NextResponse.json({ message: 'Profile created successfully!', profile }, { status: 201 });
    }

  } catch (error) {
    console.error('Error processing job seeker profile POST:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}