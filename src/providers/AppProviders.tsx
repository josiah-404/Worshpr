'use client';

import { useState, type FC } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <SessionProvider>{children}</SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
