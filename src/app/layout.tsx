import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AppProviders } from '@/providers/AppProviders';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EMBR',
  description: 'Centralized Event Management System',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AppProviders>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster theme="dark" richColors position="bottom-right" />
        </AppProviders>
      </body>
    </html>
  );
}
