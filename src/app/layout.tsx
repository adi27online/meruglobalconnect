// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css'; // Adjust this path if your global CSS is located elsewhere (e.g., '../styles/globals.css')

export const metadata = {
  title: 'My Community Hub',
  description: 'Your central place for community connections.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This is the ClerkProvider wrapping your entire application
    <ClerkProvider>
      <html lang="en">
        <body>
          {children} {/* This is where all your pages and nested layouts will be rendered */}
        </body>
      </html>
    </ClerkProvider>
  );
}