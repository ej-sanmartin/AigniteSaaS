import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'Your App - Modern Solution for Your Needs',
    template: '%s | Your App'
  },
  description: 'Your App helps you manage and optimize your workflow with powerful features and intuitive interface.',
  keywords: ['app', 'productivity', 'management', 'workflow', 'tools'],
  authors: [{ name: 'Your Company' }],
  creator: 'Your Company',
  publisher: 'Your Company',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'Your App',
    title: 'Your App - Modern Solution for Your Needs',
    description: 'Your App helps you manage and optimize your workflow with powerful features and intuitive interface.',
    images: [{
      url: 'https://your-domain.com/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Your App Preview',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your App - Modern Solution for Your Needs',
    description: 'Your App helps you manage and optimize your workflow with powerful features and intuitive interface.',
    creator: '@yourhandle',
    images: ['https://your-domain.com/twitter-image.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayoutClient>{children}</RootLayoutClient>;
} 