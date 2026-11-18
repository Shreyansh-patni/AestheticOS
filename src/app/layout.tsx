import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'AestheticOS — Personal Fitness Operating System',
  description: 'Precision workout tracking, physique architecture, nutrition, and progressive overload.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AestheticOS',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body className="h-full bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white">
        <ThemeProvider>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
