'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import moment from 'moment';
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
  Wifi,
  X,
  AlertTriangle
} from 'lucide-react';
import { WhatsAppStateSkeleton, SchedulesGridSkeleton, TimelineSkeleton } from '@/components/skeletons';

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
  start_date?: string;
  end_date?: string;
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

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
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
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 10000);
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

  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    try {
      setDeleting(true);
      await fetch(`/api/schedules/${scheduleToDelete.id}`, { method: 'DELETE' });
      setScheduleToDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayLocal();
  const todaysJobs = jobs.filter(j => j.scheduled_at.startsWith(todayStr));

  // Filter schedules that are active TODAY (whether enabled or disabled), excluding completed single-date tasks
  const schedulesToday = schedules.filter(s => {
    const startDate = s.start_date || s.target_date;
    const endDate = s.end_date;

    // Date Range Mode: Active if today is within [start_date, end_date]
    if (startDate && endDate) {
      if (todayStr < startDate || todayStr > endDate) return false;
    }

    // Single Specific Date Mode: Active ONLY if start_date === today AND not already completed
    if (startDate && !endDate) {
      if (todayStr !== startDate) return false;
      const sentJob = jobs.find(j => j.schedule_id === s.id && j.status === 'SENT');
      if (sentJob) return false; // Exclude completed 1-time tasks!
    }

    // Daily Recurring Mode: Active every day
    return true;
  });

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
      <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 min-w-0 max-w-full">
        {loading ? (
          <WhatsAppStateSkeleton />
        ) : (
          <>
            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5 min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">WhatsApp Web State</h2>
                </div>
                <button
                  onClick={() => fetchData(false)}
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

                {(waStatus.status === 'DISCONNECTED' || waStatus.status === 'ERROR') && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2 text-xs text-red-400 max-w-full overflow-hidden">
                    <div className="font-bold flex items-center space-x-1.5 text-red-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {waStatus.lastError?.includes('Opening in existing browser session') || waStatus.lastError?.includes('already in use')
                          ? 'Chromium Profile Busy'
                          : 'WhatsApp Session Offline'}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-red-300/90 leading-relaxed break-words">
                      {waStatus.lastError?.includes('Opening in existing browser session') || waStatus.lastError?.includes('already in use')
                        ? 'The Chromium browser profile is locked by another running process. Please close any open Chrome/Chromium windows or wait a moment.'
                        : waStatus.lastError || 'Playwright session is offline. The worker cannot send automated messages until WhatsApp is connected.'}
                    </p>

                    {waStatus.lastError && (
                      <div className="pt-1">
                        <details className="group">
                          <summary className="cursor-pointer text-[10px] font-semibold text-red-400/80 hover:text-red-300 transition select-none flex items-center space-x-1">
                            <span>View Technical Error Trace</span>
                          </summary>
                          <div className="mt-2 bg-slate-950/80 p-2.5 rounded-lg border border-red-500/20 max-h-32 overflow-y-auto overflow-x-hidden text-[10px] font-mono text-red-400/80 leading-normal break-all whitespace-pre-wrap">
                            {waStatus.lastError}
                          </div>
                        </details>
                      </div>
                    )}
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

            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 min-w-0 max-w-full overflow-hidden">
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
          </>
        )}
      </div>

      <div className="lg:col-span-2 space-y-8">
        {loading ? (
          <SchedulesGridSkeleton />
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">Today&apos;s Active Schedules</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {schedulesToday.length}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/schedules"
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <span>View All Tasks ({schedules.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/schedule"
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Schedule</span>
                </Link>
              </div>
            </div>

            {schedulesToday.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schedulesToday.map((schedule) => (
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
                          <span>
                            Date:{' '}
                            <strong className="text-emerald-300 font-bold">
                              {schedule.start_date && schedule.end_date
                                ? `${moment(schedule.start_date).format('DD-MM-YYYY')} to ${moment(schedule.end_date).format('DD-MM-YYYY')}`
                                : schedule.start_date
                                ? moment(schedule.start_date).format('DD-MM-YYYY')
                                : schedule.target_date
                                ? moment(schedule.target_date).format('DD-MM-YYYY')
                                : 'Daily'}
                            </strong>{' '}
                            at <strong className="text-emerald-300 font-bold">{schedule.first_send_time}</strong> ({schedule.timezone || 'Asia/Kolkata'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic line-clamp-3 leading-relaxed">&ldquo;{schedule.message_1}&rdquo;</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setScheduleToDelete(schedule)}
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
              <div className="py-12 px-6 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">No Active Schedules for Today</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  There are no message tasks scheduled to run today. You can view all created tasks or set up a new schedule.
                </p>
                <div className="pt-2 flex items-center justify-center space-x-3">
                  <Link
                    href="/schedules"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700"
                  >
                    View All Tasks ({schedules.length})
                  </Link>
                  <Link
                    href="/schedule"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                  >
                    Add New Schedule
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <TimelineSkeleton />
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">Today&apos;s Dispatch Timeline</h2>
              </div>
              <span className="text-xs font-medium text-slate-400 font-mono">
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
                          <span>Scheduled: {moment(job.scheduled_at).format('DD-MM-YYYY, hh:mm A')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {job.status === 'SENT' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ✓ Sent {job.sent_at ? `at ${moment(job.sent_at).format('DD-MM-YYYY, hh:mm A')}` : ''}
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
        )}
      </div>

      {scheduleToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setScheduleToDelete(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              disabled={deleting}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                Delete Schedule Task?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete the schedule for <strong className="text-slate-200">{scheduleToDelete.group_name}</strong>?
              </p>
              <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-left space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning: This action cannot be undone.</span>
                </div>
                <p className="text-[11px] text-red-300/80 pl-4">
                  This will remove the schedule configuration and cancel all future pending dispatches.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setScheduleToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSchedule}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
