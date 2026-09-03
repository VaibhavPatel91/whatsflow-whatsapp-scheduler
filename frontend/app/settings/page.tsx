'use client';

import { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Monitor, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';

interface WAStatus {
  status: string;
  lastConnectedAt?: string;
  lastError?: string;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<WAStatus>({ status: 'DISCONNECTED' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      await fetchStatus();
      setMsg('WhatsApp browser session marked as disconnected.');
    } catch (err: any) {
      setMsg('Error disconnecting session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>System Settings & Session Control</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect Playwright Chromium persistent profile settings and safety parameters.
        </p>
      </div>

      {msg && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm text-slate-200">
          {msg}
        </div>
      )}

      {/* Browser Context Card */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-slate-200 flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-emerald-400" />
          <span>Playwright Browser Engine Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Persistent Profile Path</span>
            <span className="font-mono text-emerald-300 text-xs">./data/whatsapp-profile</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Browser Engine</span>
            <span className="font-semibold text-slate-200 text-xs">Chromium (Visible Mode)</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Active Connection Status</div>
            <div className="text-xs text-slate-400">Current State: {status.status}</div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect Session</span>
          </button>
        </div>
      </div>

      {/* Legal & Safety Disclaimer Card */}
      <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20 space-y-4 text-amber-200 text-sm">
        <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Safety & Terms Compliance Policy</span>
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-amber-200/90">
          <li>This application uses standard DOM manipulation via Playwright Chromium to automate WhatsApp Web on your personal computer.</li>
          <li>It is designed exclusively for personal, low-frequency messaging (up to 2 messages/day) to groups in which your account is already a member.</li>
          <li>Mass marketing, contact scraping, unsolicited messaging, or CAPTCHA bypass techniques are strictly prohibited and intentionally not implemented.</li>
          <li>Always keep the browser context private on your own device. Session cookies and QR tokens are never uploaded or stored on remote servers.</li>
        </ul>
      </div>
    </div>
  );
}
