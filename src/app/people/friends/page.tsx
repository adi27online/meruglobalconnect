// src/app/people/friends/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './friends.module.css'; // Import CSS Module
import Navbar from '@/components/Navbar';
import Link from 'next/link';

// Define interface for a friend's public profile
interface FriendUser {
  _id: string;
  name: string;
  profilePicture?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
}

export default function MyFriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingChat, setIsProcessingChat] = useState(false); // New state for chat button loading
  const [chatMessage, setChatMessage] = useState<string | null>(null); // New state for chat action message

  useEffect(() => {
    const fetchFriends = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch a list of friends from the API route
        const res = await fetch('/api/user/friends', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFriends(data.friends);
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to load friends list.');
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Failed to fetch friends:', err);
        setError('Network error or server unreachable. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [router]);


  const handleStartChat = async (friendId: string) => {
    if (isProcessingChat) return; // Prevent multiple clicks
    setIsProcessingChat(true);
    setChatMessage(null); // Clear previous messages

    const token = localStorage.getItem('token');
    if (!token) {
      setChatMessage('Authentication required to start chat.');
      router.push('/login');
      setIsProcessingChat(false);
      return;
    }

    try {
      const res = await fetch('/api/user/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });

      const data = await res.json();

      if (res.ok) {
        setChatMessage(data.message);
        // Redirect to messages page with the conversation ID
        // In a more complex app, you might use URL params to auto-select the conversation
        router.push('/messages'); // For now, just navigate to the messages page
      } else {
        setChatMessage(data.error || 'Failed to start conversation.');
      }
    } catch (err) {
      console.error('Start chat network error:', err);
      setChatMessage('Network error starting chat. Please try again.');
    } finally {
      setIsProcessingChat(false);
    }
  };


  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading friends list...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2>Error:</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.buttonReload}>
              Try Again
            </button>
            <Link href="/dashboard" className={styles.backToDashboardLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.friendsListBox}>
          <h1 className={styles.title}>My Friends</h1>

          {chatMessage && <p className={styles.actionMessage}>{chatMessage}</p>} {/* Display chat messages */}

          {friends.length === 0 ? (
            <p className={styles.noFriendsMessage}>You don't have any friends yet. Find people to connect!</p>
          ) : (
            <div className={styles.friendsList}>
              {friends.map((friend) => (
                <div key={friend._id} className={styles.friendCard}>
                  {/* Make the profile picture clickable */}
                  <Link href={`/profile/view/${friend._id}`} className={styles.friendPicLink}>
                    {friend.profilePicture ? (
                      <img src={friend.profilePicture} alt={friend.name} className={styles.friendPic} />
                    ) : (
                      <div className={styles.friendPicPlaceholder}>
                        {friend.name ? friend.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </Link>
                  {/* Make the info section clickable */}
                  <Link href={`/profile/view/${friend._id}`} className={styles.friendInfoLink}>
                    <div className={styles.friendInfo}>
                      <h3>{friend.name}</h3>
                      {friend.city && friend.state && friend.country && (
                          <p className={styles.friendLocation}>{friend.city}, {friend.state}, {friend.country}</p>
                      )}
                      {friend.bio && <p className={styles.friendBio}>{friend.bio}</p>}
                    </div>
                  </Link>
                  <div className={styles.friendActions}> {/* New div for buttons */}
                    <button
                      onClick={() => handleStartChat(friend._id)}
                      className={styles.chatButton}
                      disabled={isProcessingChat} // Disable button while processing
                    >
                      {isProcessingChat ? 'Starting...' : 'Chat'}
                    </button>
                    {/* Future: Add more actions here like 'View Profile' */}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.backLinkContainer}>
            <Link href="/dashboard" className={styles.backToDashboardLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
