// src/app/register/page.tsx
'use client';
import { useState } from 'react';
import styles from './register.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        // Check if payment is required based on the backend response
        if (data.requiresPayment && data.userId) {
          setMessage('🎉 Registration successful! Please proceed to payment to complete your account. Redirecting to payment...');
          setTimeout(() => {
            router.push(`/payment?userId=${data.userId}`); // Redirect to payment page with userId
          }, 3000); // Redirect after 3 seconds
        } else {
          // This case might not be hit if payment is always required, but good for robustness
          setMessage(data.message || 'Registration successful! Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } else {
        const data = await res.json();
        setMessage(data?.error || 'Registration failed. Please try again.');
        // If an existing user needs payment, guide them there
        if (data.requiresPayment && data.userId) {
          setMessage(data.error + ' Redirecting to payment page.');
          setTimeout(() => {
            router.push(`/payment?userId=${data.userId}`);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Registration network error:', err);
      setMessage('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.heroWrapper}>
      <div className={styles.heroContentSmallBox}>
        <h1 className={styles.title}>Create Your Account</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={styles.input}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={styles.input}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={styles.input}
            required
            disabled={loading}
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>
          {message && <p className={styles.message}>{message}</p>}
        </form>

        <div className={styles.backLinkContainer}>
          <Link href="/" className={styles.backToHomeLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
