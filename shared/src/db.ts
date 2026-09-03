import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Schedule, ScheduledJob, WhatsAppConnectionRecord, WhatsAppStatus, JobStatus } from './types';

const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sqlite.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  message_1 TEXT NOT NULL,
  message_2 TEXT NOT NULL,
  first_send_time TEXT NOT NULL,
  gap_minutes INTEGER NOT NULL DEFAULT 120,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  run_date TEXT NOT NULL,
  message_number INTEGER NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  idempotency_key TEXT UNIQUE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS whatsapp_connection (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED',
  last_connected_at TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Ensure default connection record exists
const initConnection = db.prepare('INSERT OR IGNORE INTO whatsapp_connection (id, status, updated_at) VALUES (\'default\', \'DISCONNECTED\', datetime(\'now\'))');
initConnection.run();

export function getDb() {
  return db;
}

// Ensure target_date column exists
try {
  db.exec("ALTER TABLE schedules ADD COLUMN target_date TEXT;");
} catch {
  // column already exists
}

// Schedules Repository
export const scheduleRepository = {
  getAll(): Schedule[] {
    const rows = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all() as any[];
    return rows.map(r => ({ ...r, enabled: Boolean(r.enabled) }));
  },

  getById(id: string): Schedule | null {
    const row = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as any;
    if (!row) return null;
    return { ...row, enabled: Boolean(row.enabled) };
  },

  create(schedule: Omit<Schedule, 'created_at' | 'updated_at'>): Schedule {
    const stmt = db.prepare(`
      INSERT INTO schedules (id, group_id, group_name, message_1, message_2, first_send_time, gap_minutes, timezone, target_date, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    stmt.run(
      schedule.id,
      schedule.group_id,
      schedule.group_name,
      schedule.message_1,
      schedule.message_2,
      schedule.first_send_time,
      schedule.gap_minutes,
      schedule.timezone,
      schedule.target_date || null,
      schedule.enabled ? 1 : 0
    );
    return this.getById(schedule.id)!;
  },

  update(id: string, updates: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at'>>): Schedule | null {
    const current = this.getById(id);
    if (!current) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.group_id !== undefined) { fields.push('group_id = ?'); values.push(updates.group_id); }
    if (updates.group_name !== undefined) { fields.push('group_name = ?'); values.push(updates.group_name); }
    if (updates.message_1 !== undefined) { fields.push('message_1 = ?'); values.push(updates.message_1); }
    if (updates.message_2 !== undefined) { fields.push('message_2 = ?'); values.push(updates.message_2); }
    if (updates.first_send_time !== undefined) { fields.push('first_send_time = ?'); values.push(updates.first_send_time); }
    if (updates.gap_minutes !== undefined) { fields.push('gap_minutes = ?'); values.push(updates.gap_minutes); }
    if (updates.timezone !== undefined) { fields.push('timezone = ?'); values.push(updates.timezone); }
    if (updates.target_date !== undefined) { fields.push('target_date = ?'); values.push(updates.target_date); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }

    if (fields.length === 0) return current;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const query = `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.getById(id);
  },


  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

// Jobs Repository
export const jobRepository = {
  getAll(limit = 100): ScheduledJob[] {
    return db.prepare('SELECT * FROM scheduled_jobs ORDER BY scheduled_at DESC LIMIT ?').all(limit) as ScheduledJob[];
  },

  getById(id: string): ScheduledJob | null {
    return (db.prepare('SELECT * FROM scheduled_jobs WHERE id = ?').get(id) as ScheduledJob) || null;
  },

  getByIdempotencyKey(key: string): ScheduledJob | null {
    return (db.prepare('SELECT * FROM scheduled_jobs WHERE idempotency_key = ?').get(key) as ScheduledJob) || null;
  },

  getPendingJobsDue(nowIso: string): ScheduledJob[] {
    return db.prepare('SELECT * FROM scheduled_jobs WHERE status = \'PENDING\' AND scheduled_at <= ? ORDER BY scheduled_at ASC').all(nowIso) as ScheduledJob[];
  },

  getByScheduleId(scheduleId: string): ScheduledJob[] {
    return db.prepare('SELECT * FROM scheduled_jobs WHERE schedule_id = ? ORDER BY scheduled_at ASC').all(scheduleId) as ScheduledJob[];
  },

  create(job: Omit<ScheduledJob, 'created_at' | 'updated_at'>): ScheduledJob {
    const stmt = db.prepare(`
      INSERT INTO scheduled_jobs (id, schedule_id, run_date, message_number, scheduled_at, status, idempotency_key, attempts, sent_at, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    stmt.run(
      job.id,
      job.schedule_id,
      job.run_date,
      job.message_number,
      job.scheduled_at,
      job.status,
      job.idempotency_key,
      job.attempts || 0,
      job.sent_at || null,
      job.error_message || null
    );
    return this.getById(job.id)!;
  },

  updateStatus(id: string, status: JobStatus, errorMessage?: string | null, incrementAttempt = false): ScheduledJob | null {
    const sentAt = status === 'SENT' ? new Date().toISOString() : null;
    let query = "UPDATE scheduled_jobs SET status = ?, updated_at = datetime('now')";
    const params: any[] = [status];

    if (sentAt) {
      query += ", sent_at = ?";
      params.push(sentAt);
    }
    if (errorMessage !== undefined) {
      query += ", error_message = ?";
      params.push(errorMessage);
    }
    if (incrementAttempt) {
      query += ", attempts = attempts + 1";
    }

    query += " WHERE id = ?";
    params.push(id);

    db.prepare(query).run(...params);
    return this.getById(id);
  },

  cancelPendingForSchedule(scheduleId: string): void {
    db.prepare("UPDATE scheduled_jobs SET status = 'CANCELLED', updated_at = datetime('now') WHERE schedule_id = ? AND status = 'PENDING'").run(scheduleId);
  },

  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM scheduled_jobs WHERE id = ?').run(id);
    return res.changes > 0;
  }
};


// WhatsApp Connection Repository
export const connectionRepository = {
  get(): WhatsAppConnectionRecord {
    const row = db.prepare("SELECT * FROM whatsapp_connection WHERE id = 'default'").get() as WhatsAppConnectionRecord;
    return row || { id: 'default', status: 'DISCONNECTED', updated_at: new Date().toISOString() };
  },


  updateStatus(status: WhatsAppStatus, lastError?: string | null): WhatsAppConnectionRecord {
    const lastConnected = status === 'CONNECTED' ? new Date().toISOString() : undefined;
    if (lastConnected) {
      db.prepare(`
        UPDATE whatsapp_connection
        SET status = ?, last_connected_at = ?, last_error = ?, updated_at = datetime('now')
        WHERE id = 'default'
      `).run(status, lastConnected, lastError || null);
    } else {
      db.prepare(`
        UPDATE whatsapp_connection
        SET status = ?, last_error = ?, updated_at = datetime('now')
        WHERE id = 'default'
      `).run(status, lastError || null);
    }
    return this.get();
  }
};

