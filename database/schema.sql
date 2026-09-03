-- Database Schema for WhatsApp Personal Group Message Scheduler

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
