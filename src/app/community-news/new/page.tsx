// src/app/community-news/new/page.tsx
'use client'; // This page uses client-side hooks (useState, useRouter)

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout'; // Import your shared Layout component
import formStyles from './newsForm.module.css'; // Use the correct CSS module for form-specific styles

export default function PostNewAnnouncementPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(''); // Added: State for the date field
  const [images, setImages] = useState<FileList | null>(null); // Changed: For file uploads
  const [loading, setLoading] = useState(false); // Changed: Renamed isLoading to loading for consistency
  const [error, setError] = useState<string | null>(null); // Changed: Renamed isError to error and message to success
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Create FormData object to send text fields and files
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('date', date); // Added: Append the date field

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]); // Append each file
      }
    }

    try {
      // Correctly target your backend API route: /api/news
      // This matches your app/api/news/route.ts file
      const response = await fetch('/api/news', {
        method: 'POST',
        // Do NOT set 'Content-Type': 'application/json' when sending FormData
        // The browser will automatically set the correct 'multipart/form-data' header
        // along with the boundary.
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Announcement posted successfully!');
        console.log('Announcement posted:', data.newsItem);
        // Clear form fields
        setTitle('');
        setContent('');
        setDate(''); // Clear date field
        setImages(null); // Clear file input
        // Optionally redirect after a short delay
        setTimeout(() => {
          router.push('/community-news'); // Go back to the news list page
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(`Error posting announcement: ${errorData.message || response.statusText}`);
        console.error('Error response:', errorData);
      }
    } catch (err) {
      console.error('Network error posting announcement:', err);
      setError('Network error. Could not post announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout> {/* Wrapped content with the Layout component */}
      <div className={formStyles.formContainer}>
        <h1 className={formStyles.formTitle}>Post New Community Announcement</h1>
        <form onSubmit={handleSubmit} className={formStyles.newsForm}>
          {error && <p className={formStyles.errorMessage}>{error}</p>}
          {success && <p className={formStyles.successMessage}>{success}</p>}

          <div className={formStyles.formGroup}>
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={formStyles.inputField}
              disabled={loading} // Use 'loading' state
            />
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="content">Content:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6} // Changed rows to 6 for better initial height
              className={formStyles.textareaField} // Use textareaField from newsForm.module.css
              disabled={loading} // Use 'loading' state
            ></textarea>
          </div>

          {/* Added: Date Input Field */}
          <div className={formStyles.formGroup}>
            <label htmlFor="date">Date (YYYY-MM-DD):</label>
            <input
              type="date" // Use type="date" for a date picker
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={formStyles.inputField}
              disabled={loading}
            />
          </div>

          {/* Changed: Images File Input Field */}
          <div className={formStyles.formGroup}>
            <label htmlFor="images">Images (Optional):</label>
            <input
              type="file"
              id="images"
              multiple // Allow multiple file selection
              accept="image/*" // Accept only image files
              onChange={(e) => setImages(e.target.files)}
              className={formStyles.fileInput} // Use fileInput from newsForm.module.css
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className={formStyles.submitButton}>
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </div>
    </Layout>
  );
}