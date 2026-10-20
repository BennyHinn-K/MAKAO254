import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Splash from '@/components/splash';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Makao254 — Luxury Kenya Stays, BnBs & Vacation Homes',
  description: 'Book verified homes across Kenya. Nairobi skyline apartments, Diani beach villas, Maasai Mara safari lodges and highland retreats. Hosted, considered, yours from check-in.',
  openGraph: {
    title: 'Makao254 — Luxury Kenya Stays, BnBs & Vacation Homes',
    description: 'Book verified homes across Kenya. Nairobi skyline apartments, Diani beach villas, Maasai Mara safari lodges and highland retreats. Hosted, considered, yours from check-in.',
    images: [
      {
        url: 'https://images.pexels.com/photos/29003510/pexels-photo-29003510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Makao254 — Luxury Kenya Stays, BnBs & Vacation Homes',
    description: 'Book verified homes across Kenya. Nairobi skyline apartments, Diani beach villas, Maasai Mara safari lodges and highland retreats. Hosted, considered, yours from check-in.',
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
      <body className={inter.className}>
        <Splash>{children}</Splash>
      </body>
    </html>
  );
}
