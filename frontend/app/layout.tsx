import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { WarningBanner } from '@/components/WarningBanner';

export const metadata: Metadata = {
  title: 'WhatsApp Group Message Scheduler',
  description: 'Local personal WhatsApp group message scheduler with Playwright automation.',
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
          WhatsApp Personal Group Message Scheduler &bull; Local Playwright Automation Engine
        </footer>
      </body>
    </html>
  );
}
