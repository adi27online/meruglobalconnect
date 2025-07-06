'use client'; // Marks this as a Client Component, necessary for Hooks and client-side interactions
import { useState } from 'react'; // React Hook for managing component state
import { useRouter } from 'next/navigation'; // Next.js Hook for programmatic navigation
import styles from './login.module.css'; // Import CSS Module for styling
import Link from 'next/link'; // Next.js Link component for client-side navigation (e.g., "Back to Home", "Register")

export default function LoginPage() {
  const router = useRouter(); // Initialize the router
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [error, setError] = useState(''); // State for displaying error messages
  const [loading, setLoading] = useState(false); // State to indicate if the login process is ongoing

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setError(''); // Clear any previous errors
    setLoading(true); // Set loading state to true

    try {
      // Send a POST request to your backend login API
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Specify content type as JSON
        body: JSON.stringify({ email, password }), // Send email and password as JSON string
      });

      const data = await res.json(); // Parse the JSON response from the backend

      // Check if the login request was successful (HTTP status 2xx)
      if (res.ok) {
        // If successful, check if a token was received
        if (data.token) {
          localStorage.setItem('token', data.token); // Store the JWT token in local storage
          router.push('/dashboard'); // Redirect to the dashboard page
        } else {
          // This case should ideally not happen if the backend is working correctly
          setError('Login successful, but no token received from server.');
        }
      } else {
        // If login failed, display the error message from the backend or a generic one
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Catch any network-related errors (e.g., server unreachable)
      console.error('Login network error:', err);
      setError('Network error or server unreachable. Please try again.');
    } finally {
      setLoading(false); // Always set loading to false after the attempt
    }
  };

  return (
    // Main container applying animated background from CSS module, consistent with register page
    <div className={styles.heroWrapper}>
      {/* Content box for the login form, consistent with register page */}
      <div className={styles.heroContentSmallBox}>
        <h1 className={styles.title}>Sign In to Your Community</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email state
            className={styles.input} // Apply consistent input styles
            required
            disabled={loading} // Disable input while loading
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Update password state
            className={styles.input} // Apply consistent input styles
            required
            disabled={loading} // Disable input while loading
          />
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'} {/* Dynamic button text */}
          </button>
          {error && <div className={styles.message}>{error}</div>} {/* Consistent class for message */}
        </form>

        {/* Links for registration and back to home page */}
        <div className={styles.authLinks}>
            <p>
                Don't have an account?{' '}
                <Link href="/register" className={styles.inlineLink}>
                    Register here
                </Link>
            </p>
            <p className={styles.mt2}> {/* Simple class for top margin */}
                <Link href="/" className={styles.inlineLink}>
                    ← Back to Home
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}