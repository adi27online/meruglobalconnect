// src/app/community-news/page.tsx
'use client'; // This page needs client-side capabilities for data fetching

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Layout from '@/components/Layout';
import styles from './communityNews.module.css';
import Link from 'next/link';

// Define the NewsItem interface (ensure this matches your backend's structure)
interface NewsItem {
  id: string;
  date: string;
  title: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
}

export default function CommunityNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect to fetch news when the component mounts
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news'); // Fetch from your backend API route
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: NewsItem[] = await response.json();
        // Sort news by creation date, most recent first (or by 'date' if you prefer)
        const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNews(sortedData);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load community news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []); // Empty dependency array means this runs once on component mount

  // Display loading state
  if (loading) {
    return (
      <Layout>
        <div className={styles.headerContainer}>
          <h1>Loading Community News...</h1>
          <Link href="/community-news/new" className={styles.postNewButton}>
            Post New
          </Link>
        </div>
        <p className={styles.loadingMessage}>Fetching latest announcements...</p>
      </Layout>
    );
  }

  // Display error state
  if (error) {
    return (
      <Layout>
        <div className={styles.headerContainer}>
          <h1>Error Loading News</h1>
          <Link href="/community-news/new" className={styles.postNewButton}>
            Post New
          </Link>
        </div>
        <p className={styles.errorMessage}>{error}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.headerContainer}>
        <h1>Latest Community News</h1>
        <Link href="/community-news/new" className={styles.postNewButton}>
          Post New
        </Link>
      </div>

      {news.length === 0 ? (
        <p className={styles.noNewsMessage}>No community news posted yet. Be the first!</p>
      ) : (
        news.map((newsItem) => (
          <div key={newsItem.id} className={styles.newsArticleCard}>
            <h2 className={styles.articleTitle}>{newsItem.title}</h2>
            {/* Display date from the news item */}
            <p className={styles.articleMeta}>By Community Admin | {newsItem.date} {newsItem.createdAt ? `(Posted: ${new Date(newsItem.createdAt).toLocaleDateString()} ${new Date(newsItem.createdAt).toLocaleTimeString()})` : ''}</p>
            
            {/* Display images if available */}
            {newsItem.imageUrls && newsItem.imageUrls.length > 0 && (
              <div className={styles.articleImages}>
                {newsItem.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${newsItem.title} image ${index + 1}`}
                    className={styles.articleImage}
                  />
                ))}
              </div>
            )}
            <p className={styles.articleSummary}>{newsItem.content}</p>
            {/* You might want a dynamic link for Read More if you have individual news pages */}
            <a href={`/community-news/${newsItem.id}`} className={styles.readMoreButton}>Read More</a>
          </div>
        ))
      )}
    </Layout>
  );
}