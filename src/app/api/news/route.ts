// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os'; // For getting temp directory
import { v4 as uuidv4 } from 'uuid'; // To generate unique filenames

// --- Placeholder for your Database / Data Storage ---
// In a real app, this would be a database call (e.g., Prisma, Mongoose, SQL query)
// For demonstration, we'll use a simple in-memory array (NOT PRODUCTION READY)
interface NewsItem {
    id: string;
    date: string;
    title: string;
    content: string;
    imageUrls: string[]; // Store array of URLs if multiple images
    createdAt: string;
}

// In a real application, this would come from a database
let newsData: NewsItem[] = [
    {
        id: 'news-1',
        date: '2025-07-12',
        title: 'Gilbert Community Pool Grand Reopening!',
        content: 'Join us for the grand reopening of the Gilbert Community Pool! After extensive renovations, our pool is ready for a summer of fun. We\'ll have free admission all day, a DJ, food trucks, and special activities for kids of all ages. Don\'t miss out on splashing into summer with your neighbors!',
        imageUrls: ['/uploads/pool-reopening-placeholder.jpg'], // Example URL
        createdAt: new Date().toISOString(),
    },
    {
        id: 'news-2',
        date: '2025-08-05',
        title: 'Annual Gilbert Neighborhood Cleanup Day',
        content: 'Help us keep Gilbert beautiful! Our annual neighborhood cleanup day is scheduled for August 5th, starting at 9 AM at Freestone Park. Volunteers needed! Gloves and bags will be provided. Lunch will be served afterwards.',
        imageUrls: ['/uploads/cleanup-day-placeholder.jpg'],
        createdAt: new Date().toISOString(),
    },
];

// In a real app, define your upload directory
// For this example, we'll use a public 'uploads' folder relative to the project root
// You'll need to create a 'public/uploads' directory in your Next.js project
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure the upload directory exists
async function ensureUploadDirExists() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create upload directory:', error);
    }
}

// Handler for GET requests (to fetch news)
export async function GET() {
    // Sort news by date, most recent first (or by createdAt)
    const sortedNews = newsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(sortedNews);
}

// Handler for POST requests (to submit new news)
export async function POST(req: NextRequest) {
    await ensureUploadDirExists(); // Make sure upload directory exists

    try {
        // Parse the FormData from the request
        const formData = await req.formData();
        const title = formData.get('title')?.toString();
        const content = formData.get('content')?.toString();
        const date = formData.get('date')?.toString();
        const imageFiles = formData.getAll('images') as File[]; // Get all files named 'images'

        if (!title || !content || !date) {
            return NextResponse.json({ message: 'Missing required fields: title, content, or date.' }, { status: 400 });
        }

        const imageUrls: string[] = [];
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                // Generate a unique filename
                const fileExtension = path.extname(file.name);
                const uniqueFileName = `${uuidv4()}${fileExtension}`;
                const filePath = path.join(UPLOAD_DIR, uniqueFileName);

                // Convert file to buffer and write to disk
                const buffer = Buffer.from(await file.arrayBuffer());
                await fs.writeFile(filePath, buffer);

                // Store the public URL
                imageUrls.push(`/uploads/${uniqueFileName}`);
            }
        }

        const newNewsItem: NewsItem = {
            id: uuidv4(), // Generate a unique ID for the news item
            date: date,
            title: title,
            content: content,
            imageUrls: imageUrls,
            createdAt: new Date().toISOString(), // Record when it was created
        };

        // In a real application, you'd save `newNewsItem` to your database
        newsData.push(newNewsItem); // Add to our in-memory array for demonstration

        return NextResponse.json({ message: 'News posted successfully!', newsItem: newNewsItem }, { status: 201 });

    } catch (error) {
        console.error('Error processing news post:', error);
        return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
    }
}