'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Calendar, History, Settings, ShieldAlert } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: MessageSquare },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30 group-hover:scale-105 transition-transform bg-slate-900 flex items-center justify-center">
              <img src="/icon.png" alt="WhatsFlow Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                WhatsFlow
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full shadow-sm">
                Pro Studio
              </span>
            </div>
          </Link>



          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
