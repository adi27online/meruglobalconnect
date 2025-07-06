// src/app/dashboard/page.tsx
'use client'; // Marks this as a Client Component for React Hooks and client-side logic
import { useState, useEffect } from 'react'; // React Hooks for state and side effects
import { useRouter } from 'next/navigation'; // Next.js Hook for programmatic navigation
import Link from 'next/link'; // Next.js Link component for client-side navigation

import styles from './dashboard.module.css'; // Import CSS Module for dashboard-specific styling
import Navbar from '@/components/Navbar'; // Import Navbar component - RE-ADDED
import Sidebar from '@/components/Sidebar'; // Import Sidebar component
import Rightbar from '@/components/Rightbar'; // Import Rightbar component
import { UserDoc } from '@/types/user'; // User interface for type safety (adjust path if needed)

// Define an interface for the user data expected on the dashboard
// It extends UserDoc but omits 'password' for security and adds 'profilePicture'
interface DashboardUser extends Omit<UserDoc, 'password'> {
  profilePicture?: string; // Optional field for user's profile picture URL
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  profession?: string;
  hobbies?: string[];
  spouse?: {
    name?: string;
  };
  children?: Array<{
    name?: string;
    age?: number;
    gender?: string;
  }>;
  isMatrimonyEnabled?: boolean;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  education?: string;
  matrimonyPictures?: string[];
}

// Interface for friend request count, for Sidebar (still needed for Sidebar if not removed entirely)
interface FriendRequestCount {
  count: number;
}

export default function DashboardPage() { // Changed to DashboardPage for consistency
  const router = useRouter(); // Initialize router for navigation
  const [userProfile, setUserProfile] = useState<DashboardUser | null>(null); // State to store fetched user data
  const [loading, setLoading] = useState(true); // State to manage loading status
  const [error, setError] = useState<string | null>(null); // State to store any error messages
  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0); // State for friend request count

  // useEffect hook runs after component mounts and handles data fetching
  useEffect(() => {
    const fetchUserProfileAndRequests = async () => { // Renamed function to reflect dual fetch
      // Get the JWT token from local storage
      const token = localStorage.getItem('token');

      // If no token is found, redirect to the login page
      if (!token) {
        router.push('/login');
        return; // Stop execution if no token
      }

      try {
        // Fetch user profile data from your backend API
        const profileRes = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Send the token in the Authorization header
          },
        });

        // Check if the API request was successful
        if (profileRes.ok) {
          const profileData: DashboardUser = await profileRes.json(); // Parse the JSON response
          setUserProfile(profileData); // Set the fetched user data to state
        } else {
          // Handle API errors (e.g., invalid token, user not found)
          const errorData = await profileRes.json();
          setError(errorData.error || 'Failed to fetch user profile.');
          // If token is unauthorized/expired, clear it and redirect to login
          if (profileRes.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
          return; // Stop further execution if profile fetch failed
        }

        // Fetch incoming friend requests count (still needed for Sidebar if it remains)
        const requestsRes = await fetch('/api/user/friend-requests/count', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (requestsRes.ok) {
          const requestsData: FriendRequestCount = await requestsRes.json();
          setIncomingRequestsCount(requestsData.count);
        } else {
          // Log error but don't prevent dashboard from loading if count fails
          const errorData = await requestsRes.json();
          console.error('Failed to load friend requests count:', errorData.error);
          setIncomingRequestsCount(0); // Default to 0 on error
        }

      } catch (err) {
        // Handle network errors (e.g., server unreachable)
        console.error('Dashboard fetch error:', err);
        setError('Network error or server unreachable. Please try again.');
      } finally {
        setLoading(false); // Set loading to false once fetch is complete (success or error)
      }
    };

    fetchUserProfileAndRequests(); // Call the fetch function when the component mounts
  }, [router]); // Dependency array: Effect re-runs if 'router' object changes (rare for pages)

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

  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the JWT token from local storage
    router.push('/login'); // Redirect to the login page
  };

  // --- Conditional Rendering for different states (Loading, Error, Content) ---

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <>
        <Navbar /> {/* Render Navbar even during loading - RE-ADDED */}
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error message if data fetching fails
  if (error) {
    return (
      <>
        <Navbar /> {/* Render Navbar even with error - RE-ADDED */}
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2>Error:</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/login')} className={styles.button}>
              Go to Login
            </button>
            <button onClick={() => window.location.reload()} className={styles.buttonReload}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // If user data is still null after loading (should be caught by error/redirect)
  // as a fallback, ensure redirection
  if (!userProfile) { // Changed from 'user' to 'userProfile' for consistency
    router.push('/login');
    return null; // Don't render anything while redirecting
  }

  // --- Render the actual Dashboard Content once user data is available ---
  return (
    <>
      <Navbar /> {/* Render Navbar at the top - RE-ADDED */}
      <div className={styles.container}>
        <Sidebar incomingRequestsCount={incomingRequestsCount} /> {/* Pass count to Sidebar */}

        <main className={styles.main}> {/* Main content area */}
          <div className={styles.dashboardProfileContent}> {/* New wrapper for profile content */}
            <h1 className={styles.title}>{userProfile.name}'s Profile</h1>

            {userProfile.profilePicture ? (
              <img
                src={userProfile.profilePicture}
                alt={`${userProfile.name}'s Profile Picture`}
                className={styles.profilePic}
              />
            ) : (
              <div className={styles.profilePicPlaceholder}>
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}

            <div className={styles.profileDetails}>
              <p><strong>Name:</strong> {userProfile.name}</p>
              {/* Display Location Data */}
              {(userProfile.city || userProfile.state || userProfile.country) && (
                <p>
                  <strong>Location:</strong>
                  {userProfile.city && ` ${userProfile.city}`}
                  {userProfile.city && userProfile.state && `, `}
                  {userProfile.state && ` ${userProfile.state}`}
                  {(userProfile.city || userProfile.state) && userProfile.country && `, `}
                  {userProfile.country && ` ${userProfile.country}`}
                </p>
              )}

              <p><strong>Email:</strong> {userProfile.email}</p>
              {userProfile.bio && <p><strong>Bio:</strong> {userProfile.bio}</p>}
              {userProfile.profession && <p><strong>Profession:</strong> {userProfile.profession}</p>}
              {userProfile.hobbies && userProfile.hobbies.length > 0 && (
                <p><strong>Hobbies:</strong> {userProfile.hobbies.join(', ')}</p>
              )}

              {/* Display Spouse Data */}
              {userProfile.spouse?.name && (
                <div className={styles.spouseSection}>
                  <h3>Spouse Details</h3>
                  <p><strong>Name:</strong> {userProfile.spouse.name}</p>
                </div>
              )}

              {/* Display Children Data */}
              {userProfile.children && userProfile.children.length > 0 && (
                <div className={styles.childrenSection}>
                  <h3>Children</h3>
                  {userProfile.children.map((child, index) => (
                    <div key={index} className={styles.childEntry}>
                      <p><strong>Child #{index + 1}:</strong></p>
                      <p className={styles.childDetail}>Name: {child.name}</p>
                      <p className={styles.childDetail}>Age: {child.age}</p>
                      <p className={styles.childDetail}>Gender: {child.gender}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Display Matrimony Status */}
              <div className={styles.matrimonyStatusSection}>
                <h3>Matrimony Status</h3>
                {typeof userProfile.isMatrimonyEnabled === 'boolean' ? ( // Check for boolean explicitly
                    userProfile.isMatrimonyEnabled ? (
                        <span className={styles.matrimonyEnabled}>Enabled <span className={styles.checkmark}>✔</span></span>
                    ) : (
                        <span className={styles.matrimonyDisabled}>Disabled <span className={styles.crossmark}>✖</span></span>
                    )
                ) : (
                    <span className={styles.matrimonyDisabled}>Not Set <span className={styles.crossmark}>✖</span></span> // Fallback for undefined/null
                )}
                <p className={styles.matrimonyHelpText}>
                    This indicates whether your profile is visible in the Matrimony section.
                </p>
              </div>

              {/* NEW: Display Matrimony Specific Details - Conditionally Rendered */}
              {userProfile.isMatrimonyEnabled && (
                  <div className={styles.matrimonyAdditionalDetailsSection}>
                      <h3>Additional Matrimony Details</h3>
                      {/* NEW: Matrimony Header with Profile Picture */}
                      <div className={styles.matrimonyHeader}>
                          {userProfile.profilePicture ? (
                              <img
                                  src={userProfile.profilePicture}
                                  alt={`${userProfile.name}'s Matrimony Profile Picture`}
                                  className={styles.matrimonySectionProfilePic}
                              />
                          ) : (
                              <div className={styles.matrimonySectionProfilePicPlaceholder}>
                                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
                              </div>
                          )}
                          <div className={styles.matrimonyBasicInfo}>
                              {userProfile.gender && <p><strong>Gender:</strong> {userProfile.gender}</p>}
                              {userProfile.dateOfBirth && <p><strong>Date of Birth:</strong> {formatDate(userProfile.dateOfBirth)}</p>}
                              {userProfile.timeOfBirth && <p><strong>Time of Birth:</strong> {userProfile.timeOfBirth}</p>}
                          </div>
                      </div>
                      {/* End Matrimony Header */}

                      {userProfile.placeOfBirth && <p><strong>Place of Birth:</strong> {userProfile.placeOfBirth}</p>}
                      {userProfile.fatherName && <p><strong>Father's Name:</strong> {userProfile.fatherName}</p>}
                      {userProfile.motherName && <p><strong>Mother's Name:</strong> {userProfile.motherName}</p>}
                      {userProfile.education && <p><strong>Education:</strong> {userProfile.education}</p>}
                      {userProfile.profession && <p><strong>Profession:</strong> {userProfile.profession}</p>} {/* Re-display for emphasis in matrimony */}

                      {/* Matrimony Pictures Gallery */}
                      {userProfile.matrimonyPictures && userProfile.matrimonyPictures.length > 0 && (
                          <div className={styles.matrimonyGallery}>
                              <h4>Matrimony Pictures</h4>
                              <div className={styles.matrimonyPicturesContainer}>
                                  {userProfile.matrimonyPictures.map((picUrl, index) => (
                                      <img
                                          key={index}
                                          src={picUrl}
                                          alt={`Matrimony Picture ${index + 1}`}
                                          className={styles.matrimonyGalleryPic}
                                      />
                                  ))}
                              </div>
                          </div>
                      )}

                      {(!userProfile.dateOfBirth && !userProfile.timeOfBirth && !userProfile.placeOfBirth &&
                        !userProfile.fatherName && !userProfile.motherName && !userProfile.gender &&
                        !userProfile.education && (!userProfile.matrimonyPictures || userProfile.matrimonyPictures.length === 0)) && (
                          <p className={styles.noAdditionalDetails}>No additional matrimony details provided yet.</p>
                      )}
                  </div>
              )}

            </div> {/* End profileDetails */}

            <div className={styles.profileActions}>
              <Link href="/profile/complete" className={styles.editProfileButton}>
                Edit My Profile
              </Link>
            </div>
          </div> {/* End dashboardProfileContent */}

          {/* Logout Button - kept outside profile content for consistent placement */}
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </main>

        {/* Right Sidebar */}
        <Rightbar />
      </div>
    </>
  );
}
