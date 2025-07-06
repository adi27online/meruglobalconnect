// src/app/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './verify-email.module.css';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();
        if (res.ok && (data.success || data.message)) {
          setVerificationStatus('success');
          setMessage(data.message || 'Your email has been successfully verified!');
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setVerificationStatus('error');
          setMessage(data.error || 'Email verification failed. Please try again or request a new link.');
        }
      } catch (err) {
        setVerificationStatus('error');
        setMessage('Network error or server unreachable. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className={styles.heroWrapper}>
      <div className={styles.heroContentSmallBox}>
        {verificationStatus === 'verifying' && (
          <>
            <div className={styles.loadingSpinner}></div>
            <h1 className={styles.title}>Verifying your email...</h1>
            <p className={styles.message}>Please wait, this may take a moment.</p>
          </>
        )}
        {verificationStatus === 'success' && (
          <>
            <h1 className={styles.successTitle}>Email Verified!</h1>
            <p className={styles.successMessage}>{message}</p>
            <Link href="/login" className={styles.button}>
              Go to Login
            </Link>
          </>
        )}
        {verificationStatus === 'error' && (
          <>
            <h1 className={styles.errorTitle}>Verification Failed</h1>
            <p className={styles.errorMessage}>{message}</p>
            <Link href="/login" className={styles.button}>
              Go to Login
            </Link>
            <p className={styles.resendPrompt}>
              If you believe this is an error or your link expired, you can{' '}
              <Link href="/login" className={styles.resendLink}>
                request a new verification email
              </Link>{' '}
              from the login page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
