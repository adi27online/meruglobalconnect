    // src/app/people/requests/page.tsx
    'use client';

    import { useState, useEffect } from 'react';
    import { useRouter } from 'next/navigation';
    import styles from './requests.module.css'; // Import CSS Module
    import Navbar from '@/components/Navbar';
    import Link from 'next/link';

    // Define interface for a public user profile (what we display for a request sender)
    interface RequestSenderUser {
    _id: string;
    name: string;
    profilePicture?: string;
    city?: string;
    state?: string;
    country?: string;
    bio?: string;
    }

    export default function IncomingFriendRequestsPage() {
    const router = useRouter();
    const [incomingRequests, setIncomingRequests] = useState<RequestSenderUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // To prevent multiple actions

    useEffect(() => {
        const fetchIncomingRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Fetch a list of users who sent friend requests to the current user
            const res = await fetch('/api/user/friend-requests/incoming', { // <--- You'll create this API route next
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            });

            if (res.ok) {
            const data = await res.json();
            setIncomingRequests(data.requests);
            } else {
            const errorData = await res.json();
            setError(errorData.error || 'Failed to load incoming friend requests.');
            if (res.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            }
        } catch (err) {
            console.error('Failed to fetch incoming friend requests:', err);
            setError('Network error or server unreachable. Please try again.');
        } finally {
            setLoading(false);
        }
        };

        fetchIncomingRequests();
    }, [router]);

    const handleAction = async (senderId: string, action: 'accept' | 'reject') => {
        if (isProcessing) return; // Prevent concurrent actions
        setIsProcessing(true);
        setActionMessage(null); // Clear previous messages

        const token = localStorage.getItem('token');
        if (!token) {
        setActionMessage('Authentication required to perform this action.');
        router.push('/login');
        setIsProcessing(false);
        return;
        }

        try {
        const res = await fetch(`/api/user/friend-requests/${action}`, { // <--- You'll create these API routes later
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ senderId }),
        });

        if (res.ok) {
            setActionMessage(`Friend request ${action === 'accept' ? 'accepted' : 'rejected'} successfully.`);
            // Remove the request from the local state immediately
            setIncomingRequests(prev => prev.filter(req => req._id !== senderId));
        } else {
            const errorData = await res.json();
            setActionMessage(errorData.error || `Failed to ${action} friend request.`);
        }
        } catch (err) {
        console.error(`Network error during ${action} friend request:`, err);
        setActionMessage('Network error. Please try again.');
        } finally {
        setIsProcessing(false);
        }
    };


    if (loading) {
        return (
        <>
            <Navbar />
            <div className={styles.container}>
            <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading incoming friend requests...</p>
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
            <div className={styles.requestsBox}>
            <h1 className={styles.title}>Incoming Friend Requests</h1>

            {actionMessage && <p className={styles.actionMessage}>{actionMessage}</p>}

            {incomingRequests.length === 0 ? (
                <p className={styles.noRequestsMessage}>You have no pending friend requests at the moment.</p>
            ) : (
                <div className={styles.requestsList}>
                {incomingRequests.map((sender) => (
                    <div key={sender._id} className={styles.requestCard}>
                    {sender.profilePicture ? (
                        <img src={sender.profilePicture} alt={sender.name} className={styles.senderPic} />
                    ) : (
                        <div className={styles.senderPicPlaceholder}>
                        {sender.name ? sender.name.charAt(0).toUpperCase() : '?'}
                        </div>
                    )}
                    <div className={styles.senderInfo}>
                        <h3>{sender.name}</h3>
                        {sender.city && sender.state && sender.country && (
                            <p className={styles.senderLocation}>{sender.city}, {sender.state}, {sender.country}</p>
                        )}
                        {sender.bio && <p className={styles.senderBio}>{sender.bio}</p>}
                    </div>
                    <div className={styles.requestActions}>
                        <button
                        onClick={() => handleAction(sender._id, 'accept')}
                        className={styles.acceptButton}
                        disabled={isProcessing}
                        >
                        Accept
                        </button>
                        <button
                        onClick={() => handleAction(sender._id, 'reject')}
                        className={styles.rejectButton}
                        disabled={isProcessing}
                        >
                        Reject
                        </button>
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