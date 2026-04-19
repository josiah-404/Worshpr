'use client';

import { useState, type FC } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressProvider } from '@bprogress/next/app';
import { OrgProvider } from '@/providers/OrgContext';
import { BibleProvider } from '@/providers/BibleProvider';

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
        <SessionProvider>
          <ProgressProvider
            height="4px"
            color="hsl(263.4 70% 50.4%)"
            options={{ showSpinner: false }}
            shallowRouting
          >
            <OrgProvider>
              <BibleProvider>{children}</BibleProvider>
            </OrgProvider>
          </ProgressProvider>
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
