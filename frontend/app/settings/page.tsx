"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ShieldAlert,
  Monitor,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

interface WAStatus {
  status: string;
  lastConnectedAt?: string;
  lastError?: string;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<WAStatus>({ status: "DISCONNECTED" });
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
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
      setMsg("");
      setErrorMsg("");
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      await fetchStatus();
      setMsg("WhatsApp browser session marked as disconnected.");
    } catch (err: any) {
      setErrorMsg("Error disconnecting session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setResetting(true);
      setMsg("");
      setErrorMsg("");
      const res = await fetch("/api/schedules/reset-database", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMsg(
          "Database reset successfully! All schedules and task execution logs have been permanently cleared.",
        );
        setShowResetModal(false);
        await fetchStatus();
      } else {
        setErrorMsg(data.error || "Failed to reset database.");
      }
    } catch (err: any) {
      setErrorMsg("Error clearing database: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>System Settings &amp; Session Control</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect Playwright Chromium persistent profile settings, reset
          database records, and review safety policies.
        </p>
      </div>

      {msg && (
        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 text-sm text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 text-sm text-red-400 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
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
            <span className="text-xs text-slate-400 block mb-1">
              Persistent Profile Path
            </span>
            <span className="font-mono text-emerald-300 text-xs">
              ./data/whatsapp-profile
            </span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">
              Browser Engine
            </span>
            <span className="font-semibold text-slate-200 text-xs">
              Chromium (Visible Mode)
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">
              Active Connection Status
            </div>
            <div className="text-xs text-slate-400">
              Current State: {status.status}
            </div>
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

      {/* Danger Zone: Database Reset Card */}
      <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400 font-bold">
            <Trash2 className="w-5 h-5" />
            <span>Database Reset</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Permanently wipe all created schedule tasks, execution job
              history, and idempotency records from your local SQLite database.
            </p>
            <p className="text-[11px] text-red-400/90 mt-1 font-semibold">
              Warning: This action is permanent and cannot be undone.
            </p>
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition shrink-0 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Database Records</span>
          </button>
        </div>
      </div>

      {/* Permanent Legal & Safety Disclaimer Card */}
      <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20 space-y-4 text-amber-200 text-sm">
        <div className="pb-3 border-b border-amber-500/20">
          <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Safety &amp; Terms Compliance Policy</span>
          </h3>
        </div>

        <p className="text-xs text-amber-300/90 leading-relaxed font-semibold">
          Unofficial WhatsApp Automation Notice: This software uses Playwright
          browser automation on your local machine. It does not use the WhatsApp
          Business API. Operate responsibly for personal daily messages only.
        </p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-amber-200/90">
          <li>
            This application uses standard DOM manipulation via Playwright
            Chromium to automate WhatsApp Web on your personal computer.
          </li>
          <li>
            It is designed exclusively for personal, low-frequency messaging to
            groups in which your account is already a member.
          </li>
          <li>
            Mass marketing, contact scraping, unsolicited messaging, or CAPTCHA
            bypass techniques are strictly prohibited and intentionally not
            implemented.
          </li>
          <li>
            Always keep the browser context private on your own device. Session
            cookies and QR tokens are never uploaded or stored on remote
            servers.
          </li>
        </ul>
      </div>

      {/* Confirmation Modal Warning Dialog */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                Confirm Full Database Reset?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to permanently clear all database records?
                This will delete all created schedules, execution job logs, and
                dispatch histories.
              </p>
              <p className="text-[11px] text-red-400 font-bold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                ⚠️ Danger: This action is permanent and cannot be reversed!
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={resetting}
                className="w-1/2 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2"
              >
                {resetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Wipe Database</span>
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
