import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Makao254 — Curated luxury stays across Kenya',
  description: 'From Nairobi’s skyline to the Kenyan coast, discover thoughtfully designed homes for the way you want to feel. Book your Makao.',
  openGraph: {
    title: 'Makao254 — Curated luxury stays across Kenya',
    description: 'From Nairobi’s skyline to the Kenyan coast, discover thoughtfully designed homes for the way you want to feel.',
    images: [
      {
        url: 'https://images.pexels.com/photos/29003510/pexels-photo-29003510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://images.pexels.com/photos/29003510/pexels-photo-29003510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
