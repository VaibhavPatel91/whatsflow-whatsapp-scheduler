'use client';

import { ShieldAlert } from 'lucide-react';

export function WarningBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm text-amber-200">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Unofficial WhatsApp Automation Notice:</strong> This software uses Playwright browser automation on your local machine. It does not use the WhatsApp Business API. Operate responsibly for personal daily messages only.
          </span>
        </div>
      </div>
    </div>
  );
}
