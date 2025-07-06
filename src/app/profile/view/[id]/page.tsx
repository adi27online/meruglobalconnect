// src/app/profile/view/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
// Import any styles or types
// import styles from './publicProfileView.module.css'; // Example

interface PublicUserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isF1Student?: boolean;
  university?: string;
  specialization?: string;
  contactNumber?: string;
  linkedInProfile?: string;
  githubProfile?: string;
  personalWebsite?: string;
  bio?: string;
}

export default function PublicProfileViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // --- REVERTED CHANGE STARTS HERE ---
  // This is the original and currently correct way to access params.id in a Client Component.
  // The previous message was a warning for future compatibility, but direct access still works.
  const userIdToView = params.id; // Get the ID from the URL parameter
  // --- REVERTED CHANGE ENDS HERE ---

  const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userIdToView) {
      const fetchUserProfile = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/user/profile?userId=${userIdToView}`);
          if (!response.ok) {
            if (response.status === 404) {
              setUserProfile(null); // User not found
            } else {
              throw new Error(`Error fetching profile: ${response.statusText}`);
            }
          } else {
            const data: PublicUserProfile = await response.json();
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [userIdToView]);

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center' }}>User profile not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '20px' }}>
        <h1>{userProfile.firstName || 'User'}'s Public Profile</h1>
        <p>Email: {userProfile.email}</p>
        {userProfile.bio && <p>Bio: {userProfile.bio}</p>}
        {userProfile.isF1Student && (
          <div>
            <h3>F1 Student Information:</h3>
            <p>University: {userProfile.university}</p>
            <p>Specialization: {userProfile.specialization}</p>
          </div>
        )}
        {userProfile.contactNumber && <p>Contact: {userProfile.contactNumber}</p>}
        {userProfile.linkedInProfile && <p>LinkedIn: <a href={userProfile.linkedInProfile} target="_blank" rel="noopener noreferrer">{userProfile.linkedInProfile}</a></p>}
        {userProfile.githubProfile && <p>GitHub: <a href={userProfile.githubProfile} target="_blank" rel="noopener noreferrer">{userProfile.githubProfile}</a></p>}
        {userProfile.personalWebsite && <p>Website: <a href={userProfile.personalWebsite} target="_blank" rel="noopener noreferrer">{userProfile.personalWebsite}</a></p>}
      </div>
    </Layout>
  );
}