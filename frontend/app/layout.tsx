import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { WarningBanner } from '@/components/WarningBanner';

export const metadata: Metadata = {
  title: 'WhatsFlow - WhatsApp Group Automation Studio',
  description: 'Local personal WhatsApp group message scheduler with Playwright automation.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex flex-col">
        <WarningBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          WhatsFlow &bull; Local Playwright WhatsApp Automation Studio
        </footer>
      </body>
    </html>
  );
}

