import type { Metadata } from 'next';
import AppProviders from './providers';

export const metadata: Metadata = {
  title: 'Anime Next',
  description: 'Group anime watching decision app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
