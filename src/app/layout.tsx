import type { Metadata, Viewport } from 'next';
import { Header, Footer } from '@/components';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: {
    default: 'FENER.CO - Fenerbahçe Futbol İstatistikleri',
    template: '%s | FENER.CO',
  },
  description: 'Fenerbahçe futbol takımının canlı skor, maç sonuçları, kadro bilgileri ve detaylı istatistikleri.',
  keywords: ['Fenerbahçe', 'futbol', 'istatistik', 'canlı skor', 'Süper Lig', 'kadro'],
  authors: [{ name: 'FENER.CO' }],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'FENER.CO',
    title: 'FENER.CO - Fenerbahçe Futbol İstatistikleri',
    description: 'Fenerbahçe futbol takımının canlı skor, maç sonuçları ve detaylı istatistikleri.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FENER.CO - Fenerbahçe Futbol İstatistikleri',
    description: 'Fenerbahçe futbol takımının canlı skor, maç sonuçları ve detaylı istatistikleri.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
