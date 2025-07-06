// src/app/people/find/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './findpeople.module.css'; // Import CSS Module
import Navbar from '@/components/Navbar';
import Link from 'next/link'; // Import Link
import Sidebar from '@/components/Sidebar'; // Import Sidebar
import Rightbar from '@/components/Rightbar'; // Import Rightbar

// Define interface for a public user profile
interface FoundUser {
  _id: string;
  name: string;
  profilePicture?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  profession?: string; // Include profession
  relationshipStatus: 'SELF' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'NOT_FRIENDS';
}

// Interface for friend request count, for Sidebar
interface FriendRequestCount {
  count: number;
}

export default function FindPeoplePage() {
  const router = useRouter();
  const [users, setUsers] = useState<FoundUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for immediate input values (what the user types)
  const [searchQuery, setSearchQuery] = useState(''); // Name search
  const [citySearch, setCitySearch] = useState(''); // City search
  const [stateSearch, setStateSearch] = useState(''); // State search

  // Debounced states for triggering the actual search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [debouncedCitySearch, setDebouncedCitySearch] = useState('');
  const [debouncedStateSearch, setDebouncedStateSearch] = useState('');

  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0); // State for friend request count
  const [actionMessage, setActionMessage] = useState<string | null>(null); // New state for action messages
  const [isProcessingFriendRequest, setIsProcessingFriendRequest] = useState(false); // New state for processing friend request


  // Debounce effect for name search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Debounce effect for city search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCitySearch(citySearch);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [citySearch]);

  // Debounce effect for state search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedStateSearch(stateSearch);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [stateSearch]);


  // Memoized function to fetch users and incoming requests, now using debounced parameters
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null); // Clear action message on new fetch
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Fetch users
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('q', debouncedSearchQuery);
      if (debouncedCitySearch) params.append('city', debouncedCitySearch);
      if (debouncedStateSearch) params.append('state', debouncedStateSearch);

      const apiUrl = `/api/user/find-people?${params.toString()}`;

      const usersRes = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      } else {
        const errorData = await usersRes.json();
        setError(errorData.error || 'Failed to load users.');
        if (usersRes.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }

      // Fetch incoming friend requests count for Sidebar
      const requestsRes = await fetch('/api/user/friend-requests/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (requestsRes.ok) {
        const requestsData: FriendRequestCount = await requestsRes.json();
        setIncomingRequestsCount(requestsData.count);
      } else {
        const errorData = await requestsRes.json();
        console.error('Failed to load friend requests count for Find People page:', errorData.error);
        setIncomingRequestsCount(0); // Default to 0 on error
      }

    } catch (err) {
      console.error('Failed to fetch initial data for find people page:', err);
      setError('Network error or server unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router, debouncedSearchQuery, debouncedCitySearch, debouncedStateSearch]);

  // Trigger search and fetch initial data when debounced values change
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Function to handle manual "Search" button click
  const handleManualSearch = () => {
    console.log("Search button clicked!");
    // When the button is clicked, immediately update the debounced states
    // This effectively forces an immediate search with the current input values
    setDebouncedSearchQuery(searchQuery);
    setDebouncedCitySearch(citySearch);
    setDebouncedStateSearch(stateSearch);
  };

  const handleSendFriendRequest = async (recipientId: string) => {
    if (isProcessingFriendRequest) return;
    setIsProcessingFriendRequest(true);
    setActionMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setActionMessage('Authentication required to send friend request.');
      router.push('/login');
      setIsProcessingFriendRequest(false);
      return;
    }

    try {
      const res = await fetch('/api/user/friend-requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId }),
      });

      if (res.ok) {
        setActionMessage('Friend request sent!');
        // Re-fetch users to update their status
        fetchInitialData(); // This will re-run the search with current filters
      } else {
        const errorData = await res.json();
        setActionMessage(errorData.error || 'Failed to send friend request.');
      }
    } catch (err) {
      console.error('Network error sending friend request:', err);
      setActionMessage('Network error. Please try again.');
    } finally {
      setIsProcessingFriendRequest(false);
    }
  };


  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Finding people...</p>
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
        <Sidebar incomingRequestsCount={incomingRequestsCount} /> {/* Sidebar component */}
        
        <main className={styles.mainContent}> {/* Main content wrapper */}
          <div className={styles.findPeopleBox}> {/* Inner box for specific content */}
            <h1 className={styles.title}>Find People</h1>

            {/* Search Inputs */}
            <div className={styles.searchInputs}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <input
                type="text"
                placeholder="Filter by city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className={styles.searchInput}
              />
              <input
                type="text"
                placeholder="Filter by state..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button onClick={handleManualSearch} className={styles.searchButton}>
                Search
              </button>
            </div>

            {actionMessage && <p className={styles.actionMessage}>{actionMessage}</p>}

            {users.length === 0 ? (
              <p className={styles.noUsersMessage}>No users found matching your criteria.</p>
            ) : (
              <div className={styles.usersList}>
                {users.map((user) => (
                  <div key={user._id} className={styles.userCard}> {/* Removed Link wrapper */}
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className={styles.userPic} />
                    ) : (
                      <div className={styles.userPicPlaceholder}>
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className={styles.userInfo}>
                      <h3>{user.name}</h3>
                      {(user.city || user.state || user.country) && (
                          <p className={styles.userLocation}>
                              {user.city && `${user.city}`}
                              {user.city && user.state && `, `}
                              {user.state && `${user.state}`}
                              {(user.city || user.state) && user.country && `, `}
                              {user.country && `${user.country}`}
                          </p>
                      )}
                      {user.profession && <p className={styles.userProfession}><strong>Profession:</strong> {user.profession}</p>}
                      {user.bio && <p className={styles.userBio}>{user.bio}</p>}
                    </div>
                    <div className={styles.userActions}> {/* Added userActions div */}
                      {user.relationshipStatus === 'NOT_FRIENDS' && (
                        <button
                          onClick={() => handleSendFriendRequest(user._id)}
                          className={styles.sendRequestButton}
                          disabled={isProcessingFriendRequest}
                        >
                          {isProcessingFriendRequest ? 'Sending...' : 'Send Friend Request'}
                        </button>
                      )}
                      {user.relationshipStatus === 'PENDING_OUTGOING' && (
                        <button className={styles.sendRequestButton} disabled>
                          Request Sent
                        </button>
                      )}
                      {user.relationshipStatus === 'PENDING_INCOMING' && (
                        <button className={styles.sendRequestButton} disabled>
                          Request Pending
                        </button>
                      )}
                      {user.relationshipStatus === 'FRIENDS' && (
                        <button className={styles.sendRequestButton} disabled>
                          Friends
                        </button>
                      )}
                      {/* Always show View Profile link as a button */}
                      <Link 
                        href={`/profile/view/${user._id}`} 
                        className={styles.viewProfileButton} // Apply new button style
                      >
                        View Profile
                      </Link>
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
          </div> {/* End findPeopleBox */}
        </main>
        
        <Rightbar /> {/* Rightbar component */}
      </div> {/* End container */}
    </>
  );
}
