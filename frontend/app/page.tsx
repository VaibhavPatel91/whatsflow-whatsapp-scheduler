'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  QrCode, 
  RefreshCw, 
  Calendar, 
  PlusCircle,
  Power,
  MessageSquareText,
  ArrowRight
} from 'lucide-react';

interface WAConnection {
  status: 'CONNECTED' | 'WAITING_FOR_QR' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
  lastConnectedAt?: string;
  lastError?: string;
}

interface Schedule {
  id: string;
  group_name: string;
  message_1: string;
  message_2: string;
  first_send_time: string;
  gap_minutes: number;
  enabled: boolean;
}

interface ScheduledJob {
  id: string;
  schedule_id: string;
  message_number: number;
  scheduled_at: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED' | 'SEND_UNVERIFIED';
  sent_at?: string;
  error_message?: string;
}

export default function Dashboard() {
  const [waStatus, setWaStatus] = useState<WAConnection>({ status: 'DISCONNECTED' });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStatus, resSchedules, resJobs] = await Promise.all([
        fetch('/api/whatsapp/status').then(r => r.json()),
        fetch('/api/schedules').then(r => r.json()),
        fetch('/api/jobs?limit=50').then(r => r.json())
      ]);

      setWaStatus(resStatus);
      setSchedules(resSchedules || []);
      setJobs(resJobs || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      await fetch('/api/whatsapp/connect', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error triggering connection:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSchedule = async (schedule: Schedule) => {
    try {
      const endpoint = schedule.enabled ? `/api/schedules/${schedule.id}/disable` : `/api/schedules/${schedule.id}/enable`;
      await fetch(endpoint, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error toggling schedule:', err);
    }
  };

  const activeSchedule = schedules.length > 0 ? schedules[0] : null;

  // Filter today's jobs
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysJobs = jobs.filter(j => j.scheduled_at.startsWith(todayStr));
  const upcomingJob = jobs.find(j => j.status === 'PENDING');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected</span>;
      case 'WAITING_FOR_QR':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30"><QrCode className="w-3.5 h-3.5 mr-1" /> Waiting for QR Scan</span>;
      case 'CONNECTING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30"><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Connecting...</span>;
      case 'ERROR':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Connection Error</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Disconnected</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Automation Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage scheduled daily WhatsApp group messages and view live connection state.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/schedule"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Configure Schedule</span>
          </Link>
        </div>
      </div>

      {/* Grid Layout: Status Card & Active Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhatsApp Connection Card */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">WhatsApp Web State</span>
              {getStatusBadge(waStatus.status)}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-300">
                {waStatus.status === 'CONNECTED' && 'Playwright Chromium context authenticated. Ready to send messages.'}
                {waStatus.status === 'WAITING_FOR_QR' && 'Please scan the QR code in the Chromium browser window launched on your machine.'}
                {waStatus.status === 'DISCONNECTED' && 'WhatsApp session is offline. Click Connect below to launch Playwright.'}
                {waStatus.status === 'ERROR' && `Error: ${waStatus.lastError || 'Failed to initialize Playwright browser.'}`}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            {waStatus.status === 'DISCONNECTED' ? (
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-sm font-semibold transition"
              >
                Launch & Connect WhatsApp
              </button>
            ) : (
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Profile: ./data/whatsapp-profile</span>
                <Link href="/settings" className="text-emerald-400 hover:underline">Manage Session &rarr;</Link>
              </div>
            )}
          </div>
        </div>

        {/* Active Schedule Overview Card */}
        <div className="md:col-span-2 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          {activeSchedule ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquareText className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-100">{activeSchedule.group_name}</h3>
                </div>
                <button
                  onClick={() => handleToggleSchedule(activeSchedule)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                    activeSchedule.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{activeSchedule.enabled ? 'Automation Enabled' : 'Disabled'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-medium text-slate-400 mb-1">Message 1 ({activeSchedule.first_send_time})</div>
                  <p className="text-sm text-slate-200 line-clamp-2 italic">&ldquo;{activeSchedule.message_1}&rdquo;</p>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-medium text-slate-400 mb-1">Message 2 (+{activeSchedule.gap_minutes} mins gap)</div>
                  <p className="text-sm text-slate-200 line-clamp-2 italic">&ldquo;{activeSchedule.message_2}&rdquo;</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No Active Schedule Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">Set up a daily schedule specifying target WhatsApp group, Message 1, Message 2, and send gap.</p>
              <Link
                href="/schedule"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition"
              >
                Create First Schedule
              </Link>
            </div>
          )}

          {activeSchedule && (
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Timezone: Asia/Kolkata</span>
              <Link href="/schedule" className="text-emerald-400 hover:underline flex items-center space-x-1">
                <span>Edit Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's Jobs Timeline */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Today&apos;s Dispatch Timeline</span>
        </h3>

        {todaysJobs.length > 0 ? (
          <div className="space-y-4">
            {todaysJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800/80"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm text-emerald-400">
                    #{job.message_number}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      Message #{job.message_number}
                    </div>
                    <div className="text-xs text-slate-400">
                      Scheduled: {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div>
                  {job.status === 'SENT' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ✓ Sent at {job.sent_at ? new Date(job.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  )}
                  {job.status === 'PENDING' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Pending
                    </span>
                  )}
                  {job.status === 'PROCESSING' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
                      Sending...
                    </span>
                  )}
                  {job.status === 'FAILED' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30" title={job.error_message || ''}>
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-slate-500">
            No messages scheduled for today yet. Make sure a schedule is enabled.
          </div>
        )}
      </div>
    </div>
  );
}
