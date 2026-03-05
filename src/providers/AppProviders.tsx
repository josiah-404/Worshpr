'use client';

import { type FC } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
};
