'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { 
  Calendar, 
  Clock, 
  PlusCircle, 
  Power, 
  Trash2, 
  Edit3, 
  MessageSquareText, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Repeat,
  Target,
  Search,
  Filter,
  ArrowLeft,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { SchedulesTableSkeleton } from '@/components/skeletons';

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
  created_at: string;
}

interface ScheduledJob {
  id: string;
  schedule_id: string;
  status: string;
}

export default function AllSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENABLED' | 'DISABLED' | 'COMPLETED'>('ALL');
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSchedules, resJobs] = await Promise.all([
        fetch('/api/schedules').then(r => r.json()).catch(() => []),
        fetch('/api/jobs?limit=200').then(r => r.json()).catch(() => [])
      ]);
      setSchedules(Array.isArray(resSchedules) ? resSchedules : []);
      setJobs(Array.isArray(resJobs) ? resJobs : []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSchedule = async (schedule: Schedule) => {
    try {
      const endpoint = schedule.enabled ? `/api/schedules/${schedule.id}/disable` : `/api/schedules/${schedule.id}/enable`;
      await fetch(endpoint, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error toggling schedule:', err);
    }
  };

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

  const todayStr = getTodayLocal();

  const isScheduleCompleted = (s: Schedule): boolean => {
    const startDate = s.start_date || s.target_date;
    const endDate = s.end_date;

    // Single specific date in the past
    if (startDate && !endDate && startDate < todayStr) {
      return true;
    }

    // Single specific date today where job was already sent
    if (startDate && !endDate && startDate === todayStr) {
      const sentJob = jobs.find(j => j.schedule_id === s.id && j.status === 'SENT');
      if (sentJob) return true;
    }

    // Date range past end date
    if (endDate && endDate < todayStr) {
      return true;
    }

    return false;
  };

  const isScheduleActiveOnFilterDate = (s: Schedule, filterDate: string): boolean => {
    const startDate = s.start_date || s.target_date;
    const endDate = s.end_date;

    if (startDate && endDate) {
      return filterDate >= startDate && filterDate <= endDate;
    }
    if (startDate && !endDate) {
      return filterDate === startDate;
    }
    if (!startDate && !endDate) {
      return true;
    }
    return false;
  };

  const getScheduleModeInfo = (s: Schedule) => {
    const startDate = s.start_date || s.target_date;
    const endDate = s.end_date;

    if (startDate && endDate) {
      return {
        label: 'Date Range',
        dateText: `${moment(startDate).format('DD-MM-YYYY')} to ${moment(endDate).format('DD-MM-YYYY')}`,
        icon: Calendar,
        colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      };
    }

    if (startDate && !endDate) {
      return {
        label: 'Single Date',
        dateText: moment(startDate).format('DD-MM-YYYY'),
        icon: Target,
        colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    }

    return {
      label: 'Daily Recurring',
      dateText: 'Every Day',
      icon: Repeat,
      colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    };
  };

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = 
      s.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.message_1.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedDateFilter) {
      if (!isScheduleActiveOnFilterDate(s, selectedDateFilter)) return false;
    }

    const completed = isScheduleCompleted(s);

    if (filterStatus === 'ENABLED') return s.enabled && !completed;
    if (filterStatus === 'DISABLED') return !s.enabled && !completed;
    if (filterStatus === 'COMPLETED') return completed;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 mr-1" title="Back to Dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <span>All Task Schedules</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage, filter, enable/disable, edit, or delete all created WhatsApp automation tasks.
          </p>
        </div>

        <Link
          href="/schedule"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Schedule</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search group name or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Date Filter Input */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold shrink-0">Filter Date:</span>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('')}
                className="text-xs text-red-400 hover:text-red-300 font-semibold underline shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
          {(['ALL', 'ENABLED', 'DISABLED', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                filterStatus === status
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Schedules' : status === 'ENABLED' ? 'Active' : status === 'DISABLED' ? 'Disabled' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <SchedulesTableSkeleton />
      ) : (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
          {filteredSchedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Target WhatsApp Group</th>
                  <th className="px-6 py-4">Message Content</th>
                  <th className="px-6 py-4">Mode &amp; Date Range</th>
                  <th className="px-6 py-4">Time &amp; Timezone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSchedules.map((schedule) => {
                  const completed = isScheduleCompleted(schedule);
                  const modeInfo = getScheduleModeInfo(schedule);
                  const ModeIcon = modeInfo.icon;

                  return (
                    <tr key={schedule.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800 shrink-0">
                            <MessageSquareText className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-100 text-sm truncate max-w-[160px]" title={schedule.group_name}>
                            {schedule.group_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-300 truncate max-w-xs italic" title={schedule.message_1}>
                          &ldquo;{schedule.message_1}&rdquo;
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${modeInfo.colorClass}`}>
                            <ModeIcon className="w-3 h-3 mr-1" />
                            {modeInfo.label}
                          </span>
                          <div className="text-[11px] font-medium text-slate-400 font-mono">
                            {modeInfo.dateText}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{schedule.first_send_time}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {schedule.timezone || 'Asia/Kolkata'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {completed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleSchedule(schedule)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                              schedule.enabled
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{schedule.enabled ? 'Enabled' : 'Disabled'}</span>
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/schedule?id=${schedule.id}`}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition border border-slate-700"
                            title="Edit Schedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setScheduleToDelete(schedule)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition border border-red-500/30"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 w-12 h-12 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Schedules Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'ALL'
                ? 'No created task schedules match your search query or status filter.'
                : 'No schedules have been created yet. Click "Add New Schedule" to create your first task.'}
            </p>
          </div>
        )}
      </div>
      )}

      {/* Delete Confirmation Modal */}
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
