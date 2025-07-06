// src/app/page.tsx
import styles from './page.module.css';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className={styles.heroWrapper}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Welcome to Our Community</h1>
        <h1 className={styles.heroTitle}>Meru of Mount Meru</h1>
        <p className={styles.heroSubtitle}>
          Connect, discover, and grow with like-minded individuals.
        </p>
        <div className={styles.buttonGroup}>
          <Link href="/register" passHref>
            <button className={styles.primaryButton} type="button">
              Register
            </button>
          </Link>
          <Link href="/login" passHref>
            <button className={styles.secondaryButton} type="button">
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
