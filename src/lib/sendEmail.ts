// src/lib/sendEmail.ts
import { Resend } from 'resend'; // Import Resend SDK

// Define the shape of the email options
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Initialize Resend with your API key
// Ensure RESEND_API_KEY is set in your .env.local and Vercel environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send an email using Resend
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API Key is not set in environment variables.');
      throw new Error('Email service not configured. Please set RESEND_API_KEY.');
    }
    if (!process.env.EMAIL_USER) { // EMAIL_USER is used as the 'from' address
      console.error('EMAIL_USER (sender email) is not set in environment variables.');
      throw new Error('Sender email not configured. Please set EMAIL_USER.');
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_USER, // Your verified sender email (e.g., noreply@meruglobalconnect.com)
      to: [to], // Resend expects an array of recipients
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      return { success: false, message: error.message || 'Failed to send email with Resend.' };
    }

    console.log(`Email sent successfully to ${to} with Resend. ID: ${data?.id}`);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error: unknown) {
    console.error('Error in sendEmail function (Resend):', error);
    let errorMessage = 'Failed to send email.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}