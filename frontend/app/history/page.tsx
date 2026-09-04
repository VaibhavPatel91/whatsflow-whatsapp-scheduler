'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';
import { History, RefreshCw, CheckCircle2, AlertCircle, Clock, Search } from 'lucide-react';

interface ScheduledJob {
  id: string;
  schedule_id: string;
  run_date: string;
  message_number: number;
  scheduled_at: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED' | 'SEND_UNVERIFIED';
  attempts: number;
  sent_at?: string;
  error_message?: string;
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs?limit=100');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching job history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === 'ALL') return true;
    return j.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Failed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Dispatch History & Audit Logs</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete trace of all scheduled WhatsApp message dispatches, idempotency keys, and error states.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchJobs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
        {filteredJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Run Date</th>
                  <th className="px-6 py-4">Message #</th>
                  <th className="px-6 py-4">Scheduled Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sent Time</th>
                  <th className="px-6 py-4">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-medium text-slate-200">{moment(job.run_date).format('DD-MM-YYYY')}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">Message #{job.message_number}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {moment(job.scheduled_at).format('DD-MM-YYYY, hh:mm A')}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {job.sent_at ? moment(job.sent_at).format('DD-MM-YYYY, hh:mm A') : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-red-400 truncate max-w-xs" title={job.error_message || ''}>
                      {job.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            No message dispatch logs matching your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
