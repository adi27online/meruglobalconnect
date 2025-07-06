// src/lib/types/announcement.ts
import { ObjectId } from 'mongodb';

export interface AnnouncementDoc {
  _id?: ObjectId; // MongoDB document ID
  title: string;
  content: string; // The main body of the announcement
  images?: string[]; // Array of URLs to images (e.g., hosted on S3, Cloudinary, etc.)
  authorId: ObjectId; // Reference to the user who posted it
  authorName: string; // The name of the author to display
  createdAt: Date; // Timestamp when the announcement was created
  updatedAt?: Date; // Timestamp for last update
}