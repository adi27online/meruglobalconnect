// src/app/matrimony/find/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import styles from './findmatrimony.module.css'; // Import CSS module
import Sidebar from '@/components/Sidebar'; // NEW: Import Sidebar
import Rightbar from '@/components/Rightbar'; // NEW: Import Rightbar


// Define interface for the user data expected on this page
interface PublicUser {
  _id: string;
  name: string;
  profilePicture?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  profession?: string;
  isMatrimonyEnabled?: boolean; // Should always be true for these results
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  gender?: string;
  education?: string;
  matrimonyPictures?: string[];
  relationshipStatus: 'SELF' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'NOT_FRIENDS';
}

// Interface for friend request count, for Sidebar
interface FriendRequestCount {
  count: number;
}

export default function FindMatrimonyPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // Debounce search input to avoid excessive API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [debouncedCityFilter, setDebouncedCityFilter] = useState('');
  const [debouncedStateFilter, setDebouncedStateFilter] = useState('');
  const [debouncedCountryFilter, setDebouncedCountryFilter] = useState('');

  const [isProcessingFriendRequest, setIsProcessingFriendRequest] = useState(false);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0); // State for friend request count

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setDebouncedCityFilter(cityFilter);
      setDebouncedStateFilter(stateFilter);
      setDebouncedCountryFilter(countryFilter);
    }, 500); // 500ms debounce time

    return () => clearTimeout(timer);
  }, [searchQuery, cityFilter, stateFilter, countryFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const queryParams = new URLSearchParams();
    if (debouncedSearchQuery) queryParams.append('q', debouncedSearchQuery);
    if (debouncedCityFilter) queryParams.append('city', debouncedCityFilter);
    if (debouncedStateFilter) queryParams.append('state', debouncedStateFilter);
    if (debouncedCountryFilter) queryParams.append('country', debouncedCountryFilter);

    try {
      const res = await fetch(`/api/matrimony/find?${queryParams.toString()}`, { // NEW API ENDPOINT
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load matrimony profiles.');
        if (res.status === 401) {
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
        console.error('Failed to load friend requests count for Find Matrimony page:', errorData.error);
        setIncomingRequestsCount(0); // Default to 0 on error
      }

    } catch (err) {
      console.error('Failed to fetch matrimony profiles:', err);
      setError('Network error or server unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router, debouncedSearchQuery, debouncedCityFilter, debouncedStateFilter, debouncedCountryFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Fetch users when debounced filters change


  // Helper to format date for display
  const formatDate = (isoDateString?: string) => {
    if (!isoDateString) return 'N/A';
    try {
      return new Date(isoDateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };

  // Function to handle manual "Search" button click
  const handleManualSearch = () => {
    // Immediately update the debounced states to force an immediate search
    setDebouncedSearchQuery(searchQuery);
    setDebouncedCityFilter(cityFilter);
    setDebouncedStateFilter(stateFilter);
    setDebouncedCountryFilter(countryFilter);
  };


  const handleSendFriendRequest = async (recipientId: string) => {
    if (isProcessingFriendRequest) return;
    setIsProcessingFriendRequest(true);
    setActionMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setActionMessage('Authentication required to send connection request.');
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
        setActionMessage('Connection request sent!');
        // Re-fetch users to update their status (e.g., remove sent user from list)
        fetchUsers(); // Re-fetch all users to update relationship status
      } else {
        const errorData = await res.json();
        setActionMessage(errorData.error || 'Failed to send connection request.');
      }
    } catch (err) {
      console.error('Network error sending connection request:', err);
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
            <p>Loading matrimony profiles...</p>
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
      <div className={styles.container}> {/* Main flex container */}
        <Sidebar incomingRequestsCount={incomingRequestsCount} /> {/* Sidebar component */}
        
        <main className={styles.matrimonyMainContent}> {/* Main content wrapper */}
          <div className={styles.matrimonyFindPeopleBox}> {/* Inner box for specific content */}
            <h1 className={styles.title}>Search Matrimony Profiles</h1>

            {/* Search Inputs */}
            <div className={styles.searchInputs}>
              <input
                type="text"
                placeholder="Search by name, bio, profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <input
                type="text"
                placeholder="City"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className={styles.searchInput}
              />
              <input
                type="text"
                placeholder="State"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className={styles.searchInput}
              />
              <input
                type="text"
                placeholder="Country"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={styles.searchInput}
              />
              {/* The search is debounced, so a dedicated button isn't strictly necessary for every keystroke,
                  but keeping it for explicit search trigger if desired. Can also remove. */}
              <button onClick={handleManualSearch} className={styles.searchButton}>
                Search
              </button>
            </div>

            {actionMessage && <p className={styles.actionMessage}>{actionMessage}</p>}

            {users.length === 0 ? (
              <p className={styles.noUsersMessage}>No matrimony profiles found matching your criteria.</p>
            ) : (
              <div className={styles.usersList}>
                {users.map((user) => (
                  <div key={user._id} className={styles.userCard}>
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className={styles.userPic} />
                    ) : (
                      <div className={styles.userPicPlaceholder}>
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className={styles.userInfo}>
                      <h3>{user.name}</h3>
                      {user.gender && <p className={styles.matrimonyDetail}><strong>Gender:</strong> {user.gender}</p>}
                      {user.dateOfBirth && <p className={styles.matrimonyDetail}><strong>DOB:</strong> {formatDate(user.dateOfBirth)}</p>}
                      {user.profession && <p className={styles.matrimonyDetail}><strong>Profession:</strong> {user.profession}</p>}
                      {user.education && <p className={styles.matrimonyDetail}><strong>Education:</strong> {user.education}</p>}

                      {(user.city || user.state || user.country) && (
                          <p className={styles.userLocation}>
                              <strong>Location:</strong>
                              {user.city && `${user.city}`}
                              {user.city && user.state && `, `}
                              {user.state && `${user.state}`}
                              {(user.city || user.state) && user.country && `, `}
                              {user.country && `${user.country}`}
                          </p>
                      )}
                      {user.bio && <p className={styles.userBio}>"{user.bio}"</p>}

                      {user.matrimonyPictures && user.matrimonyPictures.length > 0 && (
                          <div className={styles.matrimonyGalleryThumbnails}>
                              {user.matrimonyPictures.slice(0, 3).map((pic, idx) => ( // Show first 3 thumbnails
                                  <img key={idx} src={pic} alt={`Matrimony ${idx+1}`} className={styles.matrimonyThumbnail} />
                              ))}
                              {user.matrimonyPictures.length > 3 && <span className={styles.morePicturesText}>+{user.matrimonyPictures.length - 3} more</span>}
                          </div>
                      )}
                    </div>
                    <div className={styles.userActions}>
                      {/* Conditional rendering for friend request/connection button */}
                      {user.relationshipStatus === 'NOT_FRIENDS' && (
                        <button
                          onClick={() => handleSendFriendRequest(user._id)}
                          className={styles.sendRequestButton}
                          disabled={isProcessingFriendRequest}
                        >
                          {isProcessingFriendRequest ? 'Sending...' : 'Send Connection Request'}
                        </button>
                      )}
                      {user.relationshipStatus === 'PENDING_OUTGOING' && (
                        <button className={styles.sendRequestButton} disabled>
                          Request Sent
                        </button>
                      )}
                      {user.relationshipStatus === 'PENDING_INCOMING' && (
                        <button className={styles.sendRequestButton} disabled>
                          Request Pending (Accept on Requests Page)
                        </button>
                      )}
                      {user.relationshipStatus === 'FRIENDS' && (
                        <button className={styles.sendRequestButton} disabled>
                          Friends
                        </button>
                      )}
                      {/* Always show View Profile link */}
                      <Link 
                        href={`/profile/view/${user._id}`} 
                        className={styles.viewProfileButton} // Use specific button style
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.backLinkContainer}>
              <Link href="/matrimony" className={styles.backToDashboardLink}> {/* Link back to matrimony home */}
                ← Back to Matrimony
              </Link>
            </div>
          </div> {/* End matrimonyFindPeopleBox */}
        </main>
        
        <Rightbar /> {/* Rightbar component */}
      </div> {/* End container */}
    </>
  );
}
