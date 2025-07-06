// types/user.ts
import { ObjectId } from 'mongodb'; // Import ObjectId type from the 'mongodb' package

// Define interfaces for nested objects
interface Spouse {
  name: string;
}

interface Child {
  name: string;
  age: number;
  gender: string;
}

// Interface for the User document stored in MongoDB
export interface UserDoc {
  _id: ObjectId; // MongoDB's default unique identifier, typed as ObjectId
  name: string;   // User's name, required string
  city?: string;
  state?: string;
  country?: string;
  email: string;  // User's email, required string
  password?: string; // User's password (will be hashed). Optional for security.
  createdAt: Date; // Timestamp for when the user was created

  bio?: string;
  profession?: string; // General profession
  hobbies?: string[]; // Array of strings for hobbies
  profilePicture?: string; // URL to a profile picture (main)

  spouse?: Spouse; // Optional spouse object
  children?: Child[]; // Optional array of child objects

  outgoingFriendRequests?: ObjectId[]; // IDs of users this user has sent requests to
  incomingFriendRequests?: ObjectId[]; // IDs of users who have sent requests to this user
  friends?: ObjectId[]; // IDs of users who are friends with this user

  conversations?: ObjectId[]; // Array of conversation IDs this user is part of

  isMatrimonyEnabled?: boolean; // Indicates if the user has enabled their matrimony profile

  // Matrimony specific details (optional, only if isMatrimonyEnabled is true)
  dateOfBirth?: Date; // Stored as Date object
  timeOfBirth?: string; // Stored as string, e.g., "HH:MM"
  placeOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  gender?: string; // e.g., "Male", "Female", "Other"
  education?: string; // e.g., "B.Sc.", "M.A.", "Ph.D."
  matrimonyPictures?: string[]; // Array of URLs for matrimony-specific pictures

  // NEW: Email Verification Fields
  isVerified: boolean; // True if email is verified, false by default
  emailVerificationToken?: string; // Token sent for email verification
  emailVerificationTokenExpires?: Date; // Expiry date for the token

  // NEW: Payment Status for Registration
  isPaid: boolean; // True if registration payment is complete, false by default
}

// New: Interface for a Conversation document
export interface ConversationDoc {
  _id: ObjectId;
  participants: ObjectId[]; // Array of user IDs involved in the conversation
  lastMessage?: ObjectId; // Optional ID of the last message in the conversation
  createdAt: Date;
  updatedAt: Date;
}

// New: Interface for a Message document
export interface MessageDoc {
  _id: ObjectId;
  conversationId: ObjectId; // ID of the conversation this message belongs to
  senderId: ObjectId;       // ID of the user who sent the message
  content: string;          // The message text
  createdAt: Date;
}

// NEW: Interface for a News Item document
export interface NewsItemDoc {
  _id: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId; // ID of the user who posted the news
  authorName: string; // Name of the user who posted the news (for display)
  createdAt: Date;
}
