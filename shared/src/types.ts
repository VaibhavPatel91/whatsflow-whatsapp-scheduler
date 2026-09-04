export type WhatsAppStatus =
  | 'WAITING_FOR_BROWSER'
  | 'WAITING_FOR_QR'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR';

export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED'
  | 'SEND_UNVERIFIED';

export interface Schedule {
  id: string;
  group_id: string;
  group_name: string;
  message_1: string;
  message_2: string;
  first_send_time: string; // HH:mm
  gap_minutes: number;
  timezone: string;
  target_date?: string; // YYYY-MM-DD (legacy fallback)
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledJob {
  id: string;
  schedule_id: string;
  run_date: string; // YYYY-MM-DD
  message_number: number; // 1 or 2
  scheduled_at: string; // ISO String
  status: JobStatus;
  idempotency_key: string;
  attempts: number;
  sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
}

export interface WhatsAppConnectionRecord {
  id: string;
  status: WhatsAppStatus;
  last_connected_at?: string | null;
  last_error?: string | null;
  updated_at: string;
}

export interface CreateScheduleInput {
  groupId: string;
  groupName: string;
  message1: string;
  message2?: string;
  firstSendTime: string;
  gapMinutes?: number;
  timezone?: string;
  targetDate?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

