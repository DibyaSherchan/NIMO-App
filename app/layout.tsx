// app/layout.tsx (Create this if it doesn't exist)
import type { Metadata } from 'next';
import './globals.css'; // Your global styles

export const metadata: Metadata = {
  title: 'NIMO - Foreign Employment Information Management System',
  description: 'Streamline your foreign employment journey with NIMO\'s comprehensive health management and automation features. Secure, fast, and reliable processing for international job seekers.',
  keywords: 'foreign employment, medical tests, NIMO, Nepal, international jobs, health screening, employment processing',
  openGraph: {
    title: 'NIMO - Foreign Employment Information Management System',
    description: 'Your comprehensive solution for foreign employment applications with integrated health management.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}