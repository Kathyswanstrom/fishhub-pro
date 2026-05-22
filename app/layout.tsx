import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FishHub.pro | F.I.S.H.',
  description: 'Fishing Intelligence Storage Hub - Marine Intelligence Command Platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
