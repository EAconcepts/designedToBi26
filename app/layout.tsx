import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost, Alex_Brush } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ToastProvider } from '@/components/ui';
import type { ReactNode } from 'react';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const jost = Jost({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

const alexBrush = Alex_Brush({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-signature',
  weight: ['400'],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Adetolani & Emmanuel's Wedding",
    default: 'Adetolani & Emmanuel — 19 December 2026',
  },
  description:
    'Official wedding invitation for Adetolani Esther & Abiodun Emmanuel. Saturday, 19 December 2026.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-ink-900 font-body">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-magenta-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-2 focus:outline-gold-500"
        >
          Skip to main content
        </a>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
