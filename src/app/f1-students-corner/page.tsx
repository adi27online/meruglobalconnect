// src/app/f1-students-corner/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout'; // Assuming you are using this Layout component
import styles from './f1StudentsCorner.module.css'; // Your CSS Module for styling

export default function F1StudentsCornerPage() {
  const router = useRouter();

  // Handler for the "F1 Student Profile Update" button
  const handleF1ProfileUpdate = () => {
    router.push('/profile/complete'); // Navigates to your existing profile completion page
  };

  // Generic handler for finding different types of students/volunteers
  const handleFindStudents = (type: 'existingF1' | 'planningF1' | 'volunteers') => {
    let queryParam = '';
    switch (type) {
      case 'existingF1':
        // Navigates to /people/find and adds a query to filter for existing F1 students
        queryParam = '?f1Status=existing'; 
        break;
      case 'planningF1':
        // Navigates to /people/find and adds a query to filter for students planning for F1
        queryParam = '?f1Status=planning'; 
        break;
      case 'volunteers':
        // Navigates to /people/find and adds a query to filter for student helper volunteers
        queryParam = '?role=f1HelperVolunteer'; 
        break;
      default:
        break;
    }
    router.push(`/people/find${queryParam}`);
  };

  return (
    <Layout>
      <div className={styles.container}>
        {/* Welcome Message Section */}
        <section className={styles.welcomeSection}>
          <h1 className={styles.pageTitle}>Welcome to the F1 Students Corner!</h1>
          <p className={styles.welcomeText}>
            This dedicated space is here to support all incoming and current F1 visa students.
            Find essential resources, connect with your peers, and get assistance for a smooth
            transition into your academic and community life in the U.S.
          </p>
        </section>

        {/* Buttons Section for Quick Actions */}
        <section className={styles.buttonsSection}>
          <h2 className={styles.sectionTitle}>Quick Actions & Connections</h2>
          <div className={styles.buttonGroup}>
            <button
              onClick={handleF1ProfileUpdate}
              className={styles.actionButton}
            >
              1. Update profile with F1 Status
            </button>

            <button
              onClick={() => handleFindStudents('existingF1')}
              className={styles.actionButton}
            >
              2. Search for other F1 Students
            </button>

            <button
              onClick={() => handleFindStudents('planningF1')}
              className={styles.actionButton}
            >
              3. Forum for F1 Students
            </button>

            <button
              onClick={() => handleFindStudents('volunteers')}
              className={styles.actionButton}
            >
              4. See Student Helper Volunteers
            </button>
          </div>
        </section>

        {/* Optional: A small section for general info/resources if needed */}
        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Explore Resources & Support</h2>
          <p>
            Beyond these quick actions, this corner also offers guidance on universities,
            arrival procedures, initial accommodation, airport pickup, and more.
            Use the buttons above to connect, or explore other relevant sections of the platform.
          </p>
        </section>
      </div>
    </Layout>
  );
}