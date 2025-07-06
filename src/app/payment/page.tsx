// src/app/payment/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import styles from './payment.module.css';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// CheckoutForm component (nested inside Elements provider)
const CheckoutForm: React.FC<{ userId: string }> = ({ userId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/payment`, // Redirect back to this page for success handling
      },
      redirect: 'if_required', // Handle redirect manually
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || 'Payment failed.');
      } else {
        setMessage("An unexpected error occurred.");
      }
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded on Stripe's side, now update your backend
      setMessage("Payment succeeded! Finalizing registration...");
      try {
        const res = await fetch('/api/payment-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage(data.message || 'Registration completed!');
          // Redirect to login after successful payment and backend update
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          setMessage(data.error || 'Payment succeeded, but failed to finalize registration. Please contact support.');
        }
      } catch (backendError) {
        console.error('Error finalizing payment on backend:', backendError);
        setMessage('Network error during finalization. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // This should not happen if redirect is 'if_required'
      setMessage("Payment processing. Please do not close this page.");
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className={styles.paymentForm}>
      <PaymentElement id="payment-element" className={styles.paymentElement} />
      <button disabled={isLoading || !stripe || !elements} id="submit" className={styles.submitButton}>
        <span id="button-text">
          {isLoading ? <div className={styles.spinner} id="spinner"></div> : "Pay now"}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message" className={styles.paymentMessage}>{message}</div>}
    </form>
  );
};


// Main PaymentPage component
export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId'); // Get userId from URL query param

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('User ID is missing. Please register first.');
      setLoading(false);
      return;
    }

    const fetchPaymentIntent = async () => {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await res.json();

        if (res.ok) {
          if (data.clientSecret === 'already_paid') {
            setError('Your account is already paid. Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || 'Failed to retrieve payment details.');
        }
      } catch (err) {
        console.error('Failed to fetch payment intent:', err);
        setError('Network error. Could not load payment form.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [userId, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Preparing payment form...</p>
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
            <Link href="/register" className={styles.button}>
              Go to Registration
            </Link>
            <button onClick={() => window.location.reload()} className={styles.buttonReload}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // Stripe options for Elements
  const options = {
    clientSecret: clientSecret,
    appearance: {
      theme: 'stripe', // 'stripe', 'flat', 'none'
      variables: {
        colorPrimary: '#007aff', // Apple-like blue
        colorBackground: '#ffffff',
        colorText: '#333',
        colorDanger: '#dc3545',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.paymentBox}>
          <h1 className={styles.title}>Complete Your Registration</h1>
          <p className={styles.subtitle}>A one-time registration fee of $10.00 is required.</p>

          {clientSecret && (
            <Elements options={options as any} stripe={stripePromise}>
              <CheckoutForm userId={userId!} /> {/* Pass userId to CheckoutForm */}
            </Elements>
          )}

          <div className={styles.backLinkContainer}>
            <Link href="/register" className={styles.backToRegisterLink}>
              ← Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
