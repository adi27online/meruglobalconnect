// src/components/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css'; // Import Navbar's CSS module

const Navbar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in localStorage to determine login status
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token); // Set isLoggedIn to true if token exists

    // Fetch friend request count only if logged in
    if (token) {
      const fetchFriendRequestCount = async () => {
        try {
          const res = await fetch('/api/user/friend-requests/count', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (res.ok) {
            setFriendRequestCount(data.count);
          } else {
            console.error('Failed to fetch friend request count:', data.error);
          }
        } catch (error) {
          console.error('Network error fetching friend request count:', error);
        }
      };
      fetchFriendRequestCount();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    setIsLoggedIn(false); // Update state
    setFriendRequestCount(0); // Reset count
    router.push('/login'); // Redirect to login page
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">MeruGlobalConnect</Link>
      </div>
      <ul className={styles.navLinks}>
        <li>
          <Link href="/">Home</Link>
        </li>
        
        {isLoggedIn ? (
          <>
            <li>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/login">Login</Link>
            </li>
            <li>
              <Link href="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
