# WhatsApp Personal Group Message Scheduler

A local web application built with **Next.js**, **Express**, **TypeScript**, and **Playwright** that allows scheduling exactly two daily pre-written WhatsApp messages to a selected WhatsApp group with a configurable gap (default: 120 minutes), operating without the WhatsApp Business API.

---

> [!WARNING]
> **UNOFFICIAL WHATSAPP AUTOMATION NOTICE**
> WhatsApp Web browser automation is unofficial and not supported by Meta/WhatsApp. Automated interactions may violate WhatsApp Terms of Service and risk account temporary suspension or restrictions. This software is built exclusively for personal, low-frequency scheduling (2 messages/day) in group chats where your account is already an active member. Operate responsibly.

---

## Features

- **Personal Daily Scheduling**: Schedule Message 1 at a chosen time (e.g. 10:00 AM) and Message 2 automatically after a gap (e.g. 120 mins &rarr; 12:00 PM).
- **Persistent Playwright Session**: Launches Chromium with a persistent local browser profile (`data/whatsapp-profile/`), retaining WhatsApp Web authentication across worker restarts.
- **Group Safety Verification**: Before typing or clicking send, the worker strictly verifies that the active open chat header title matches the targeted group name.
- **Idempotency & Duplicate Prevention**: Structured idempotency keys (`scheduleId_YYYY-MM-DD_messageNum`) guarantee that messages are never re-sent upon worker restarts.
- **Live Next.js Dashboard**: Visual status badges (`CONNECTED`, `WAITING_FOR_QR`, `DISCONNECTED`), today's dispatch timeline, job history logs, and manual schedule toggles.
- **Zero-Config Local SQLite Database**: Auto-initialized WAL-enabled database storing schedules and job execution logs locally.

---

## Architecture Overview

```
whatsapp-scheduler/
├── frontend/       # Next.js 14 App Router UI (Tailwind CSS, Lucide icons)
├── backend/        # Express REST API (Zod validation, SQLite DB routes)
├── worker/         # Playwright Chromium engine & cron polling scheduler
├── shared/         # Shared TypeScript interfaces, DB repositories & time math
├── database/       # SQL schema and SQLite database storage (sqlite.db)
├── data/           # Persistent Playwright profile (whatsapp-profile/) [GITIGNORED]
├── .env.example
├── package.json
└── README.md
```

---

## Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons, React Hook Form, Zod
- **Backend API**: Node.js, Express, TypeScript, Zod, Helmet, CORS
- **Automation Worker**: Playwright (Chromium persistent context)
- **Database**: SQLite (`better-sqlite3`) / PostgreSQL-ready
- **Scheduler & Date Math**: Luxon (Timezone & midnight roll-over calculations)

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Operating System**: macOS, Linux, or Windows (Mac OS Sonoma/Sequoia tested)

---

## Installation & Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright Chromium Browser**:
   ```bash
   npx playwright install chromium
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

---

## Running the Application

Run frontend, backend, and Playwright worker concurrently in development mode:

```bash
npm run dev
```

Alternatively, launch services individually in separate terminals:

```bash
# Terminal 1: Express REST API (Port 4000)
npm run dev:backend

# Terminal 2: Playwright Worker Engine
npm run dev:worker

# Terminal 3: Next.js Dashboard (Port 3000)
npm run dev:web
```

Access the dashboard at **[http://localhost:3000](http://localhost:3000)**.

---

## Initial WhatsApp QR Setup

1. Open the dashboard at `http://localhost:3000`.
2. Click **Launch & Connect WhatsApp** (or run `npm run dev:worker`).
3. A visible Chromium browser window will launch automatically.
4. On your mobile phone, open **WhatsApp &rarr; Linked Devices &rarr; Link a Device**.
5. Scan the QR code displayed in the Chromium browser window.
6. Once authenticated, the dashboard status badge will switch to **CONNECTED**.
7. The browser context is saved locally to `./data/whatsapp-profile` and will remain authenticated across app restarts.

---

## How Automatic Sending Works

1. Navigate to **`/schedule`** in the dashboard.
2. Select your target WhatsApp group name (e.g. `Office Team`).
3. Enter **Message 1** (e.g. `Good morning everyone!`).
4. Enter **Message 2** (e.g. `Today's update will be shared shortly.`).
5. Select **First Send Time** (e.g. `10:00 AM`).
6. Set **Gap Minutes** (default `120` minutes). The dashboard will preview Message 2 send time as `12:00 PM`.
7. Click **Save & Activate Schedule**.
8. The worker polls every 15 seconds:
   - At 10:00 AM, the worker searches for `Office Team`, verifies active header title matches, sends Message 1, and marks job `SENT`.
   - At 12:00 PM, the worker sends Message 2 and marks job `SENT`.

---

## Security & Privacy Guidelines

- **Session Isolation**: Playwright profile credentials are stored in `data/whatsapp-profile/` which is strictly included in `.gitignore`. Never commit session data to Git repositories.
- **No Password Storage**: Authentication relies entirely on WhatsApp Web QR code pairing.
- **Header Verification**: Message dispatches verify that the open chat header title matches target string to prevent mis-sending.
- **Local Network Scoping**: The Express API runs on `localhost` by default.

---

## Troubleshooting

- **WhatsApp Disconnected**: Re-launch the worker via `npm run dev:worker` or click Connect in Settings. If session expired, rescan the QR code.
- **Group Not Found**: Ensure your WhatsApp account is an existing member of the target group and that the group name is spelled identically.
- **Port Conflict (4000 / 3000)**: Change `PORT` in `.env` if 4000 or 3000 is occupied.

---

## License

Personal & Educational Use Only.
