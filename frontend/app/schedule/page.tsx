'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, MessageSquare, Globe, CheckCircle2, ArrowRight } from 'lucide-react';

function ScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleIdParam = searchParams.get('id');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [existingScheduleId, setExistingScheduleId] = useState<string | null>(null);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [message1, setMessage1] = useState('Good morning everyone!');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [firstSendTime, setFirstSendTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [enabled, setEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
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
            if (s.target_date) setTargetDate(s.target_date);
            setFirstSendTime(s.first_send_time);
            setTimezone(s.timezone || 'Asia/Kolkata');
            setEnabled(s.enabled);
          }
        }
      } catch (err) {
        console.error('Error initializing schedule form:', err);
      }
    };

    init();
  }, [scheduleIdParam]);

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
        targetDate,
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
          Configure an automated WhatsApp message task for a specific date and time.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
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
            autoComplete="off"
          />
          <datalist id="group-suggestions">
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <p className="text-xs text-slate-500 mt-1.5">
            Select a previously created group or type any new WhatsApp group name.
          </p>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Message Content *</span>
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

        {/* Schedule Date, Send Time & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Schedule Date *</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Send Time *</span>
            </label>
            <input
              type="time"
              value={firstSendTime}
              onChange={(e) => setFirstSendTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Timezone</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
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
    <Suspense fallback={<div className="text-center text-slate-400 py-10">Loading schedule configuration...</div>}>
      <ScheduleForm />
    </Suspense>
  );
}



