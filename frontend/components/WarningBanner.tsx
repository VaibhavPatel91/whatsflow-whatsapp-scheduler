'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export function WarningBanner() {
  const [dismissed, setDismissed] = useState<boolean>(true); // default true until mounted to avoid SSR flash

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_wta_warning_banner') === 'true';
    setDismissed(isHidden);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hide_wta_warning_banner', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm text-amber-200">
        <div className="flex items-center space-x-2.5 pr-4">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Unofficial WhatsApp Automation Notice:</strong> This software uses Playwright browser automation on your local machine. It does not use the WhatsApp Business API. Operate responsibly for personal daily messages only.
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 hover:text-amber-100 transition shrink-0"
          title="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

