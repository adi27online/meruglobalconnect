// src/components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sidebar.module.css';

interface SidebarProps {
  incomingRequestsCount: number;
  currentUserId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ incomingRequestsCount, currentUserId }) => {
  const pathname = usePathname();

  // Define the dashboard path
  const dashboardPath = '/dashboard'; 

  return (
    <aside className={styles.sidebarContainer}>
      <h2 className={styles.navigationTitle}>Navigation</h2>

      <nav className={styles.navList}>
        {/* Conditional link for "View My Profile" */}
        {currentUserId && (
          <Link
            // --- CHANGE THIS LINE ---
            href={dashboardPath} // Now points to the dashboard
            // --- END CHANGE ---
            className={pathname === dashboardPath ? styles.navLinkActive : styles.navLink} // Update active state check
          >
            <span className={styles.linkIcon}>👤</span> View My Profile
          </Link>
        )}

        <Link
          href="/profile/complete"
          className={pathname === '/profile/complete' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>📝</span> Edit My Profile
        </Link>

        <Link
          href="/people/find"
          className={pathname === '/people/find' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>🔍</span> Find People
        </Link>

        <Link
          href="/people/requests"
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
          href="/people/friends"
          className={pathname === '/people/friends' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>🤝</span> My Friends
        </Link>

        <Link
          href="/messages"
          className={pathname === '/messages' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>💬</span> Messages
        </Link>

        <Link
          href="/matrimony"
          className={pathname === '/matrimony' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>💍</span> Matrimony
        </Link>

        <Link
          href="/senior-matrimony"
          className={pathname === '/senior-matrimony' ? styles.navLinkActive : styles.navLink}
        >
          <span className={styles.linkIcon}>✨</span> Senior/Special Matrimony
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;