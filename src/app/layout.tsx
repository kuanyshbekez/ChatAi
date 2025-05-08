import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'История Героя',
  description: 'Интерактивная текстовая игра на основе ИИ',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5C85D6' }, // HSL(210, 70%, 55%) - Primary Blue
    { media: '(prefers-color-scheme: dark)', color: '#5C85D6' }   // Primary Blue (same for dark theme in current globals.css)
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'История Героя',
    // startupImage: [], // Optionally add startup images for iOS
  },
  icons: {
    apple: [
      // data-ai-hint cannot be added here as IconDescriptor doesn't support arbitrary props.
      // The URL itself is a placeholder.
      { url: 'https://picsum.photos/180/180', sizes: '180x180', type: 'image/png' }
    ],
    // Not adding 'icon' to avoid creating favicons as per guidelines.
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* <head> is automatically managed by Next.js using the metadata object */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ServiceWorkerRegistration />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
