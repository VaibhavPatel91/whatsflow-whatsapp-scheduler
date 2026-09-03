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
  ArrowRight,
  ShieldCheck,
  Activity,
  Trash2,
  Edit3,
  Globe,
  Wifi
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
  timezone?: string;
  target_date?: string;
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
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysJobs = jobs.filter(j => j.scheduled_at.startsWith(todayStr));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Connected
          </span>
        );
      case 'WAITING_FOR_QR':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10">
            <QrCode className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Waiting for QR Scan
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-blue-400" /> Connecting...
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-400" /> Connection Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Offline / Disconnected
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* LEFT SIDE: WhatsApp Web State & System Web State */}
      <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
        
        {/* CARD 1: WhatsApp Web State */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">WhatsApp Web State</h2>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              title="Refresh Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-400 mb-2 font-medium">Session Status</div>
              {getStatusBadge(waStatus.status)}
            </div>

            {/* Error / Disconnected Alert Banner */}
            {(waStatus.status === 'DISCONNECTED' || waStatus.status === 'ERROR') && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-1.5 text-xs text-red-400">
                <div className="font-bold flex items-center space-x-1.5 text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp Session Disconnected</span>
                </div>
                <p className="text-[11px] text-red-400/90 leading-relaxed">
                  {waStatus.lastError || 'Playwright session is offline. The worker cannot send automated messages until WhatsApp is connected.'}
                </p>
              </div>
            )}

            {waStatus.status === 'WAITING_FOR_QR' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-1.5 text-xs text-amber-400">
                <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>Scan QR Code</span>
                </div>
                <p className="text-[11px] text-amber-400/90 leading-relaxed">
                  Scan the WhatsApp Web QR code in the open Chromium browser window on your machine.
                </p>
              </div>
            )}

            {waStatus.status === 'CONNECTED' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-400 leading-relaxed">
                ✓ Playwright session authenticated &amp; connected. Ready to dispatch scheduled messages.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition border border-slate-700 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>{actionLoading ? 'Verifying Session in Browser...' : 'Verify Live Session in Browser'}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="font-mono text-slate-500">Profile: whatsapp-profile</span>
              <Link href="/settings" className="text-emerald-400 font-semibold hover:underline flex items-center space-x-1">
                <span>Manage Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* CARD 2: System Web State */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">System Web State</h2>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-500 animate-ping'}`} />
          </div>

          <div>
            {isOnline ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-1 text-xs text-emerald-400">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Network Online</span>
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  Internet connection active. Network is ready for WhatsApp Web dispatches.
                </p>
              </div>
            ) : (
              <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-xl space-y-1 text-xs text-amber-300">
                <div className="font-bold flex items-center space-x-1.5 text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Warning: No Internet Connection</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Your device is currently offline. WhatsApp dispatches will fail until internet connection is restored.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>


      {/* RIGHT SIDE: Active Daily Schedules (UP) & Today's Dispatch Timeline (DOWN) */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* UP: Active Daily Schedules Section */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">Active Daily Schedules</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {schedules.length}
              </span>
            </div>
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Schedule</span>
            </Link>
          </div>

          {schedules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {schedules.map((schedule) => (
                <div 
                  key={schedule.id} 
                  className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800">
                          <MessageSquareText className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-slate-100 truncate max-w-[140px]" title={schedule.group_name}>
                          {schedule.group_name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleToggleSchedule(schedule)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          schedule.enabled
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{schedule.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Date: <strong className="text-emerald-300 font-bold">{schedule.target_date || 'Daily'}</strong> at <strong className="text-emerald-300 font-bold">{schedule.first_send_time}</strong> ({schedule.timezone || 'Asia/Kolkata'})</span>
                      </div>
                      <p className="text-xs text-slate-300 italic line-clamp-3 leading-relaxed">&ldquo;{schedule.message_1}&rdquo;</p>
                    </div>

                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-400 hover:text-red-300 font-medium flex items-center space-x-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                    <Link 
                      href={`/schedule?id=${schedule.id}`} 
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Schedule</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200">No Active Schedules</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
                Set up a daily automated message schedule specifying your target WhatsApp group, message content, and send time.
              </p>
              <Link
                href="/schedule"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
              >
                Create First Schedule
              </Link>
            </div>
          )}
        </div>

        {/* DOWN: Today's Dispatch Timeline Section */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">Today&apos;s Dispatch Timeline</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {todaysJobs.length} Job(s) Scheduled Today
            </span>
          </div>

          {todaysJobs.length > 0 ? (
            <div className="space-y-3">
              {todaysJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400">
                      #{job.message_number}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">
                        Message Dispatch #{job.message_number}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Scheduled: {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {job.status === 'SENT' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ✓ Sent {job.sent_at ? `at ${new Date(job.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </span>
                    )}
                    {job.status === 'PENDING' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Pending
                      </span>
                    )}
                    {job.status === 'PROCESSING' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
                        Sending...
                      </span>
                    )}
                    {job.status === 'FAILED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30" title={job.error_message || ''}>
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              No messages scheduled for today yet. Make sure a schedule is created &amp; enabled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
