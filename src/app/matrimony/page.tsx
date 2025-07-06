'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './matrimony.module.css';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Rightbar from '@/components/Rightbar';

interface Spouse { name: string; }
interface Child { name: string; age: number; gender: string; }

interface MatrimonyUserProfile {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  email: string;
  bio?: string;
  profession?: string;
  hobbies?: string[];
  profilePicture?: string;
  spouse?: Spouse;
  children?: Child[];
  isMatrimonyEnabled?: boolean;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  gender?: string;
  education?: string;
  matrimonyPictures?: string[];
}

interface FriendRequestCount { count: number; }

export default function MatrimonyPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<MatrimonyUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatrimonyContent, setShowMatrimonyContent] = useState(false);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0);

  useEffect(() => {
    const fetchUserProfileAndRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const profileRes = await fetch('/api/user/profile', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const userData: MatrimonyUserProfile = await profileRes.json();
          if (userData.isMatrimonyEnabled) {
            setUserProfile(userData);
          } else {
            setError("Matrimony section is not enabled for your profile. Please enable it in 'Edit Profile'.");
            setUserProfile(null);
          }
        } else {
          const errorData = await profileRes.json();
          setError(errorData.error || 'Failed to load matrimony profile.');
          if (profileRes.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        }

        const requestsRes = await fetch('/api/user/friend-requests/count', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (requestsRes.ok) {
          const requestsData: FriendRequestCount = await requestsRes.json();
          setIncomingRequestsCount(requestsData.count);
        } else {
          const errorData = await requestsRes.json();
          console.error('Failed to load friend requests count for Matrimony page:', errorData.error);
          setIncomingRequestsCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch data for matrimony page:', err);
        setError('Network error or server unreachable. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileAndRequests();
  }, [router]);

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

  const handleEnterMatrimony = () => setShowMatrimonyContent(true);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading matrimony profile...</p>
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
            <button onClick={() => router.push('/profile/complete')} className={styles.button}>
              Go to Edit Profile
            </button>
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

  if (!userProfile || !userProfile.isMatrimonyEnabled) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2>Matrimony Profile Not Available</h2>
            <p>
              This section requires your matrimony profile to be enabled.
              Please go to "Edit Profile" and enable the matrimony section.
            </p>
            <button onClick={() => router.push('/profile/complete')} className={styles.button}>
              Go to Edit Profile
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
        <Sidebar incomingRequestsCount={incomingRequestsCount} />

        <main className={styles.matrimonyMainContent}>
          {!showMatrimonyContent ? (
            <div className={styles.rulesSection}>
              <h1 className={styles.title}>Matrimony Section Rules</h1>
              <ul className={styles.rulesList}>
                <li><span className={styles.ruleIcon}>💡</span> Respect all users and their privacy.</li>
                <li><span className={styles.ruleIcon}>✅</span> Ensure your profile information is accurate and up-to-date.</li>
                <li><span className={styles.ruleIcon}>🚫</span> No harassment, spam, or inappropriate content.</li>
                <li><span className={styles.ruleIcon}>🔒</span> Your safety is important; be cautious when sharing personal details.</li>
                <li><span className={styles.ruleIcon}>⚖️</span> Adhere to all community guidelines and terms of service.</li>
              </ul>
              <button onClick={handleEnterMatrimony} className={styles.enterMatrimonyButton}>
                Enter Matrimony Section
              </button>
              <div className={styles.backLinkContainer}>
                <Link href="/dashboard" className={styles.backToDashboardLink}>
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.matrimonyProfileDetailsBox}>
              <h1 className={styles.title}>{userProfile.name}'s Matrimony Profile</h1>
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
              <div className={styles.matrimonyDetails}>
                {userProfile.placeOfBirth && <p><strong>Place of Birth:</strong> {userProfile.placeOfBirth}</p>}
                {userProfile.fatherName && <p><strong>Father's Name:</strong> {userProfile.fatherName}</p>}
                {userProfile.motherName && <p><strong>Mother's Name:</strong> {userProfile.motherName}</p>}
                {userProfile.education && <p><strong>Education:</strong> {userProfile.education}</p>}
                {userProfile.profession && <p><strong>Profession:</strong> {userProfile.profession}</p>}
                {(userProfile.city || userProfile.state || userProfile.country) && (
                  <p>
                    <strong>Current Location:</strong>
                    {userProfile.city && ` ${userProfile.city}`}
                    {userProfile.city && userProfile.state && `, `}
                    {userProfile.state && ` ${userProfile.state}`}
                    {(userProfile.city || userProfile.state) && userProfile.country && `, `}
                    {userProfile.country && ` ${userProfile.country}`}
                  </p>
                )}
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
              <div className={styles.profileActions}>
                <Link href="/matrimony/find" className={styles.editProfileButton}>
                  Search for Matrimony Profiles 
                </Link>
                <Link href="/dashboard" className={styles.backToDashboardLink}>
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </main>
        <Rightbar />
      </div>
    </>
  );
}
