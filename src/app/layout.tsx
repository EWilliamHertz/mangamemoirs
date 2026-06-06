import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MangaMemoirs — Turn Your Story Into Manga & Anime',
  description: 'AI-powered manga and anime storyboard creator. Upload your memoir, PDF, or story and watch it come to life, panel by panel.',
  keywords: ['manga creator', 'anime generator', 'AI manga', 'memoir manga', 'storyboard AI'],
  openGraph: {
    title: 'MangaMemoirs',
    description: 'Turn your memoirs and stories into stunning manga & anime storyboards with AI.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-sans`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
