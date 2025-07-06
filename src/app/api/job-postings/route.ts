// src/app/api/job-postings/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Import Clerk's server-side auth helper
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for mock data

// --- Mock Database (replace with your actual database) ---
let mockJobPostings = [
  {
    id: 'jp1',
    employerId: 'user_123abc', // Example user ID
    jobTitle: 'Senior Full Stack Developer',
    companyName: 'Innovate Solutions Inc.',
    location: 'Remote',
    jobDescription: 'Seeking an experienced full-stack developer to lead our new product initiatives...',
    responsibilities: 'Design, develop, and deploy scalable web applications. Collaborate with cross-functional teams...',
    qualifications: '5+ years experience in React, Node.js, and MongoDB. Strong problem-solving skills.',
    employmentType: 'full-time' as const,
    salaryRange: '$120,000 - $150,000',
    applicationInstructions: 'Apply online via our careers portal at careers.innovatesolutions.com',
    contactEmail: 'careers@innovatesolutions.com',
    contactPersonName: 'Jane Doe',
    contactPersonEmail: 'jane.doe@innovatesolutions.com',
    deadline: '2025-08-31',
    createdAt: new Date('2025-07-01T10:00:00Z').toISOString(),
    status: 'active' as const,
  },
  {
    id: 'jp2',
    employerId: 'user_xyz789',
    jobTitle: 'Marketing Specialist',
    companyName: 'Global Brands',
    location: 'New York, NY',
    jobDescription: 'Join our marketing team to develop and execute campaigns...',
    responsibilities: 'Manage social media, create content, analyze campaign performance.',
    qualifications: '2+ years experience in digital marketing. Familiarity with SEO and SEM.',
    employmentType: 'full-time' as const,
    salaryRange: '$60,000 - $75,000',
    applicationInstructions: 'Send resume and cover letter to jobs@globalbrands.com',
    contactEmail: 'info@globalbrands.com',
    contactPersonName: 'John Smith',
    contactPersonEmail: 'john.smith@globalbrands.com',
    deadline: '2025-07-20',
    createdAt: new Date('2025-06-25T14:30:00Z').toISOString(),
    status: 'active' as const,
  },
];
// --- End Mock Database ---

// Interface for Job Posting (copied from page.tsx for consistency)
interface JobPosting {
  id: string;
  employerId: string; // userId of the poster
  jobTitle: string;
  companyName: string;
  location: string;
  jobDescription: string;
  responsibilities: string;
  qualifications: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  salaryRange?: string;
  applicationInstructions: string;
  contactEmail: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  deadline?: string;
  createdAt: string;
  status: 'active' | 'closed';
}

/**
 * GET handler to fetch all job postings.
 * This route is currently public.
 */
export async function GET() {
  try {
    // In a real application, you would fetch this data from your database
    // e.g., const jobPostings = await db.collection('jobPostings').find().toArray();

    return NextResponse.json(mockJobPostings, { status: 200 });
  } catch (error) {
    console.error('API Error: Failed to fetch job postings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST handler to create a new job posting.
 * This route is protected by Clerk authentication.
 */
export async function POST(request: Request) {
  // 1. Authenticate user using Clerk
  const { userId } = auth();

  if (!userId) {
    // If no user is authenticated, return a 401 Unauthorized response
    return NextResponse.json({ message: 'Unauthorized. Please log in to post a job.' }, { status: 401 });
  }

  try {
    // 2. Parse the request body
    const body = await request.json();

    // 3. Basic validation (add more robust validation as needed)
    const {
      jobTitle,
      companyName,
      location,
      jobDescription,
      responsibilities,
      qualifications,
      employmentType,
      salaryRange,
      applicationInstructions,
      contactEmail,
      contactPersonName,
      contactPersonEmail,
      deadline,
    } = body;

    if (!jobTitle || !companyName || !location || !jobDescription || !employmentType || !applicationInstructions || !contactEmail) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // 4. Create a new job posting object
    const newJobPosting: JobPosting = {
      id: uuidv4(), // Generate a unique ID for mock data
      employerId: userId, // Assign the current authenticated user's ID as the employer
      jobTitle,
      companyName,
      location,
      jobDescription,
      responsibilities,
      qualifications,
      employmentType,
      salaryRange: salaryRange || undefined,
      applicationInstructions,
      contactEmail,
      contactPersonName: contactPersonName || undefined,
      contactPersonEmail: contactPersonEmail || undefined,
      deadline: deadline || undefined,
      createdAt: new Date().toISOString(),
      status: 'active', // Default status for new postings
    };

    // 5. Save the new job posting (in a real app, this would be to your database)
    mockJobPostings.push(newJobPosting);
    console.log('New Job Posting created by', userId, ':', newJobPosting.jobTitle);

    // 6. Return a success response
    return NextResponse.json({ message: 'Job posting created successfully', jobPosting: newJobPosting }, { status: 201 });

  } catch (error) {
    console.error('API Error: Failed to create job posting:', error);
    return NextResponse.json({ message: 'Failed to create job posting' }, { status: 500 });
  }
}