// src/components/Layout.tsx
'use client'; // <--- ADD THIS LINE

import React, { ReactNode } from 'react';
import styles from '@/app/community-news/communityNews.module.css'; // Reusing your existing layout styles
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Rightbar from './Rightbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const incomingRequestsCount = 5;
  const currentUserId = 'user123';

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <aside className={styles.communitySidebarLeft}>
          <Sidebar
            incomingRequestsCount={incomingRequestsCount}
            currentUserId={currentUserId}
          />
        </aside>
        <main className={styles.communityMainContent}>
          {children} {/* This is where your page content will be rendered */}
        </main>
        <aside className={styles.communitySidebarRight}>
          <Rightbar
            incomingRequestsCount={incomingRequestsCount}
            currentUserId={currentUserId}
          />
        </aside>
      </div>
    </>
  );
};

export default Layout;