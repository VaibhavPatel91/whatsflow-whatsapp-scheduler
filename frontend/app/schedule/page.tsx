'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import moment from 'moment';
import { Calendar, Clock, MessageSquare, Globe, CheckCircle2, ArrowRight, Target, Repeat } from 'lucide-react';
import { ScheduleFormSkeleton } from '@/components/skeletons';

function ScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleIdParam = searchParams.get('id');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [existingScheduleId, setExistingScheduleId] = useState<string | null>(null);

  const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form State
  const [groupName, setGroupName] = useState('');
  const [message1, setMessage1] = useState('Good morning everyone!');
  const [startDate, setStartDate] = useState(getTodayLocal);
  const [endDate, setEndDate] = useState('');
  const [firstSendTime, setFirstSendTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [enabled, setEnabled] = useState(true);

  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        setInitializing(true);
        const [resGroups, resSchedules] = await Promise.all([
          fetch('/api/whatsapp/groups').then(r => r.json()).catch(() => []),
          fetch('/api/schedules').then(r => r.json()).catch(() => [])
        ]);

        const groupNamesSet = new Set<string>();
        if (Array.isArray(resSchedules)) {
          resSchedules.forEach((s: any) => {
            if (s.group_name) groupNamesSet.add(s.group_name);
          });
        }
        if (Array.isArray(resGroups)) {
          resGroups.forEach((g: any) => {
            if (g.name) groupNamesSet.add(g.name);
          });
        }
        setSuggestions(Array.from(groupNamesSet));

        if (scheduleIdParam) {
          const s = await fetch(`/api/schedules/${scheduleIdParam}`).then(r => r.json());
          if (s && s.id) {
            setExistingScheduleId(s.id);
            setGroupName(s.group_name);
            setMessage1(s.message_1);
            setStartDate(s.start_date || s.target_date || getTodayLocal());
            setEndDate(s.end_date || '');
            setFirstSendTime(s.first_send_time);
            setTimezone(s.timezone || 'Asia/Kolkata');
            setEnabled(s.enabled);
          }
        }
      } catch (err) {
        console.error('Error initializing schedule form:', err);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [scheduleIdParam]);

  if (initializing) {
    return <ScheduleFormSkeleton />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const targetGroup = groupName.trim();
    if (!targetGroup) {
      setErrorMessage('Target WhatsApp Group Name is required.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        groupId: targetGroup,
        groupName: targetGroup,
        message1,
        message2: '',
        firstSendTime,
        gapMinutes: 0,
        timezone,
        startDate: startDate || '',
        endDate: endDate || '',
        targetDate: startDate || '',
        enabled
      };

      let res;
      if (existingScheduleId) {
        res = await fetch(`/api/schedules/${existingScheduleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setSuccessMessage(existingScheduleId ? 'Task updated & activated!' : 'New task scheduled & activated!');
        setTimeout(() => router.push('/'), 1200);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || 'Failed to save task.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with backend API.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-emerald-400" />
          <span>{existingScheduleId ? 'Edit Scheduled Task' : 'Schedule New Task'}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure an automated WhatsApp message task for a daily schedule, date range, or specific single date.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm break-words max-w-full overflow-hidden">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        {/* Target WhatsApp Group Name Input with Autocomplete Suggestions */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Target WhatsApp Group Name *
          </label>
          <input
            type="text"
            list="group-suggestions"
            placeholder="Type group name or select from suggestions (e.g. Finance, Office)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
            required
          />
          <datalist id="group-suggestions">
            {suggestions.map((name, idx) => (
              <option key={idx} value={name} />
            ))}
          </datalist>
          <p className="text-xs text-slate-400 mt-1.5">
            Tip: Must match the exact name of the group in your WhatsApp Web.
          </p>
        </div>

        {/* Message Content Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Message Content *</span>
            <span className="text-xs text-slate-400 font-normal">Supports Emojis &amp; Formatting</span>
          </label>
          <textarea
            rows={4}
            value={message1}
            onChange={(e) => setMessage1(e.target.value)}
            placeholder="Type your WhatsApp message content here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
            required
          />
        </div>

        {/* Schedule Controls: Start Date, End Date, Send Time & Timezone */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Schedule Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Start Date *</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            {/* End Schedule Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>End Date <span className="text-slate-500 font-normal">(Optional)</span></span>
                </label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Send Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send Time *</span>
              </label>
              <input
                type="time"
                value={firstSendTime}
                onChange={(e) => setFirstSendTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Timezone</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          {/* Real-Time Scheduling Mode Banner */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs flex items-center space-x-3">
            {startDate && endDate ? (
              <>
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="leading-relaxed">
                  <span className="font-bold text-blue-300">Date Range Mode:</span>
                  <span className="text-slate-300 ml-1.5">
                    Message will dispatch daily between <strong className="text-emerald-400">{moment(startDate).format('DD-MM-YYYY')}</strong> and <strong className="text-emerald-400">{moment(endDate).format('DD-MM-YYYY')}</strong> at <strong className="text-emerald-400">{firstSendTime}</strong>.
                  </span>
                </div>
              </>
            ) : startDate && !endDate ? (
              <>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div className="leading-relaxed">
                  <span className="font-bold text-emerald-300">Single Specific Date Mode:</span>
                  <span className="text-slate-300 ml-1.5">
                    Message will dispatch 1-time on <strong className="text-emerald-400">{moment(startDate).format('DD-MM-YYYY')}</strong> at <strong className="text-emerald-400">{firstSendTime}</strong>.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="leading-relaxed">
                  <span className="font-bold text-amber-300">Daily Recurring Mode:</span>
                  <span className="text-slate-300 ml-1.5">
                    Message will dispatch every day at <strong className="text-emerald-400">{firstSendTime}</strong>.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Enable Switch */}
        <div className="pt-4 border-t border-slate-800 flex items-center space-x-3">
          <input
            type="checkbox"
            id="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
          />
          <label htmlFor="enabled" className="text-sm font-semibold text-slate-200 cursor-pointer">
            Enable This Task
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
          >
            <span>{saving ? 'Saving Task...' : existingScheduleId ? 'Update Task' : 'Save & Activate Task'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );

}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleFormSkeleton />}>
      <ScheduleForm />
    </Suspense>
  );
}



