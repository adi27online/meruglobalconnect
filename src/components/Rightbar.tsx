// src/components/Rightbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname hook
import styles from './rightbar.module.css'; // Import the CSS module

interface RightbarProps {
  incomingRequestsCount: number;
  currentUserId: string | null; // Accept currentUserId as a prop
}

const Rightbar: React.FC<RightbarProps> = ({ incomingRequestsCount, currentUserId }) => {
  const pathname = usePathname(); // Get current pathname

  // Define the dashboard path
  const dashboardPath = '/dashboard';

  return (
    <aside className={styles.rightbarContainer}> {/* Apply container class */}
      <h2 className={styles.navigationTitle}>Quick Links</h2> {/* Apply title class */}

      <nav className={styles.navList}> {/* Apply nav list class */}
        {/* Conditional link for "My Dashboard" */}
        {currentUserId && ( // Still renders conditionally based on user ID presence
          <Link
            // --- CHANGE THIS LINE ---
            href={dashboardPath} // Now points to the dashboard route
            // --- END CHANGE ---
            className={pathname === dashboardPath ? styles.navLinkActive : styles.navLink} // Update active state check
          >
            <span className={styles.linkIcon}>👤</span> My Dashboard
          </Link>
        )}

        <Link
          href="/community-news" // Link to Community News page
          className={pathname === '/community-news' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>📰</span> Community News
        </Link>

        <Link
          href="/plan-meet-greet" // Assuming this will be the path
          className={pathname === '/plan-meet-greet' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>🗓️</span> Plan Meet & Greet
        </Link>

        <Link
          href="/host-guest" // Assuming this will be the path
          className={pathname === '/host-guest' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>🏡</span> Host a Guest
        </Link>

        <Link
          href="/people/requests" // Friend Requests page
          className={pathname === '/people/requests' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>✉️</span> Friend Requests
          {incomingRequestsCount > 0 && (
            <span className={styles.requestCountBadge}>
              {incomingRequestsCount}
            </span>
          )}
        </Link>

        <Link
          href="/youth-connect" // Assuming this will be the path
          className={pathname === '/youth-connect' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>✨</span> Youth Connect
        </Link>

        <Link
          href="/jobs-careers" // Assuming this will be the path
          className={pathname === '/jobs-careers' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>💼</span> Job/Career Section
        </Link>

        <Link
          href="/f1-students-corner" // Assuming this will be the path
          className={pathname === '/f1-students-corner' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>🧑‍🎓</span> F1 Students Corner
        </Link>

        <Link
          href="/visiting-parents" // Assuming this will be the path
          className={pathname === '/visiting-parents' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>✈️</span> Visiting Parents
        </Link>

        <Link
          href="/genetic-testing" // Assuming this will be the path
          className={pathname === '/genetic-testing' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>🧬</span> Genetic Testing
        </Link>

        <Link
          href="/community-service" // Assuming this will be the path
          className={pathname === '/community-service' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>❤️</span> Comm Service/Give Back
        </Link>
      </nav>
    </aside>
  );
};

export default Rightbar;