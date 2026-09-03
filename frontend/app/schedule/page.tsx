'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MessageSquare, Globe, CheckCircle2, ArrowRight } from 'lucide-react';

interface WhatsAppGroup {
  id: string;
  name: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [existingScheduleId, setExistingScheduleId] = useState<string | null>(null);

  // Form State
  const [groupId, setGroupId] = useState('Office Team');
  const [groupName, setGroupName] = useState('Office Team');
  const [customGroupName, setCustomGroupName] = useState('');
  const [message1, setMessage1] = useState('Good morning everyone!');
  const [message2, setMessage2] = useState("Today's update will be shared shortly.");
  const [firstSendTime, setFirstSendTime] = useState('10:00');
  const [gapMinutes, setGapMinutes] = useState(120);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [enabled, setEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Fetch available groups & existing schedule
    const init = async () => {
      try {
        const [resGroups, resSchedules] = await Promise.all([
          fetch('/api/whatsapp/groups').then(r => r.json()),
          fetch('/api/schedules').then(r => r.json())
        ]);

        if (Array.isArray(resGroups) && resGroups.length > 0) {
          setGroups(resGroups);
        }

        if (Array.isArray(resSchedules) && resSchedules.length > 0) {
          const s = resSchedules[0];
          setExistingScheduleId(s.id);
          setGroupId(s.group_id);
          setGroupName(s.group_name);
          setMessage1(s.message_1);
          setMessage2(s.message_2);
          setFirstSendTime(s.first_send_time);
          setGapMinutes(s.gap_minutes);
          setTimezone(s.timezone);
          setEnabled(s.enabled);
        }
      } catch (err) {
        console.error('Error initializing schedule form:', err);
      }
    };

    init();
  }, []);

  // Calculate Message 2 Send Time string for live preview
  const calculateSecondTimePreview = () => {
    try {
      const [h, m] = firstSendTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + Number(gapMinutes);
      const secondH = Math.floor((totalMinutes / 60) % 24);
      const secondM = Math.floor(totalMinutes % 60);

      const period = secondH >= 12 ? 'PM' : 'AM';
      const displayH = secondH % 12 === 0 ? 12 : secondH % 12;
      return `${displayH.toString().padStart(2, '0')}:${secondM.toString().padStart(2, '0')} ${period}`;
    } catch {
      return '--:--';
    }
  };

  const handleGroupSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setGroupId('CUSTOM');
      setGroupName(customGroupName || '');
    } else {
      setGroupId(val);
      setGroupName(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const targetGroup = groupId === 'CUSTOM' ? customGroupName : groupName;
    if (!targetGroup.trim()) {
      setErrorMessage('Target WhatsApp Group Name is required.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        groupId: targetGroup,
        groupName: targetGroup,
        message1,
        message2,
        firstSendTime,
        gapMinutes: Number(gapMinutes),
        timezone,
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
        setSuccessMessage('Schedule successfully saved! Pending daily jobs generated.');
        setTimeout(() => router.push('/'), 1500);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || 'Failed to save schedule.');
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
          <span>Configure Daily Message Schedule</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Set up exactly two daily WhatsApp messages sent to a specific WhatsApp group with an automated gap.
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
        {/* WhatsApp Group Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Target WhatsApp Group Name *
          </label>
          <select
            value={groupId}
            onChange={handleGroupSelectChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value="CUSTOM">+ Enter Custom Group Name</option>
          </select>

          {groupId === 'CUSTOM' && (
            <input
              type="text"
              placeholder="Exact WhatsApp Group Name"
              value={customGroupName}
              onChange={(e) => setCustomGroupName(e.target.value)}
              className="mt-3 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          )}
          <p className="text-xs text-slate-500 mt-1.5">
            The target group header name must match this string exactly before sending.
          </p>
        </div>

        {/* Message 1 Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Message 1 *</span>
            <span className="text-xs font-normal text-slate-400">First Daily Send</span>
          </label>
          <textarea
            rows={3}
            value={message1}
            onChange={(e) => setMessage1(e.target.value)}
            placeholder="e.g. Good morning everyone!"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
            required
          />
        </div>

        {/* First Send Time & Gap Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>First Send Time *</span>
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
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Gap Between Messages (Minutes) *
            </label>
            <input
              type="number"
              min={1}
              value={gapMinutes}
              onChange={(e) => setGapMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Automatic Message 2 Time</div>
              <div className="text-sm font-bold text-emerald-300">{calculateSecondTimePreview()}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Calculated: {firstSendTime} + {gapMinutes} mins
          </div>
        </div>

        {/* Message 2 Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Message 2 *</span>
            <span className="text-xs font-normal text-emerald-400">Sent Automatically at {calculateSecondTimePreview()}</span>
          </label>
          <textarea
            rows={3}
            value={message2}
            onChange={(e) => setMessage2(e.target.value)}
            placeholder="e.g. Today's update will be shared shortly."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
            required
          />
        </div>

        {/* Timezone & Enable Switch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
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

          <div className="flex items-center space-x-3 pt-6">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
            <label htmlFor="enabled" className="text-sm font-semibold text-slate-200 cursor-pointer">
              Enable Daily Message Schedule
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
          >
            <span>{saving ? 'Saving Schedule...' : 'Save & Activate Schedule'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
