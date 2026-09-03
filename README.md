# WhatsFlow — WhatsApp Message Scheduler & Automation Studio 🚀

A modern, powerful, local open-source **WhatsApp Message Scheduler** built with **Next.js**, **Express**, **TypeScript**, and **Playwright**. **WhatsFlow** allows you to **schedule WhatsApp messages** to specific WhatsApp groups or chats for any date and time, running entirely on your local machine without needing the official WhatsApp Business API.

---

## 💡 How This Project Works (Plain & Simple English)

**WhatsFlow** acts as your personal virtual assistant for WhatsApp. Here is how it works step-by-step in simple terms:

1. **Configure Your Message Task**:
   - Go to the **Schedule** page on the web dashboard.
   - Type or select your target **WhatsApp Group Name** (e.g. `Finance`, `Office Team`, or `Family`).
   - Write your message content, choose your **Schedule Date** and **Send Time** (e.g. `2026-09-05` at `10:00 AM`), and click **Save & Activate Task**.

2. **Local Database Storage**:
   - WhatsFlow saves your scheduled task safely in a local SQLite database (`database/sqlite.db`) on your computer.

3. **Smart Time Polling**:
   - A lightweight background process (worker) on your machine monitors the clock.
   - Your browser stays **closed** while waiting for the scheduled time, consuming zero extra RAM or CPU.

4. **Automated & Safe Dispatch**:
   - When the exact date and time arrives, WhatsFlow automatically launches a headless or visible Playwright Chromium browser.
   - It navigates to WhatsApp Web using your saved login session.
   - It searches for your target group, opens the chat, verifies that the chat header title matches your group name (preventing any wrong sends), types your message, and clicks send.
   - Once sent, **it automatically closes the browser tab** and logs the dispatch status on your dashboard timeline!

---

> [!WARNING]
> **UNOFFICIAL WHATSAPP AUTOMATION NOTICE**
> WhatsFlow uses Playwright browser automation on your local computer. It does not use the official WhatsApp Business API. Automated interactions may violate WhatsApp Terms of Service if abused. This software is designed exclusively for personal, low-frequency daily scheduling in group chats where your account is already an active member. Operate responsibly.

---

## ✨ Key Features (WhatsFlow V2)

- **Schedule WhatsApp Messages for Any Group**: Easily schedule messages for any personal or work WhatsApp group (e.g. `Finance`, `Office`, `Marketing`).
- **Multi-Task & Multi-Group Scheduling**: Create, edit, toggle, and delete multiple independent scheduled messages for different WhatsApp groups concurrently.
- **Specific Date & Send Time Selection**: Choose exact calendar dates (`YYYY-MM-DD`) and times (`HH:mm`) with timezone support (e.g. `Asia/Kolkata`, `UTC`, `EST`).
- **Smart Group Autocomplete**: Direct text input with dynamic `<datalist>` suggestions populated from your saved schedules and detected groups.
- **Auto-Close Browser Engine**: Chromium only opens when a message dispatch is due and automatically closes immediately after sending to keep system memory light.
- **Header Safety Title Verification**: Playwright strictly checks the open chat header title (`#main header`) before typing to ensure 100% accurate recipient verification.
- **Idempotency & Duplicate Prevention**: Unique idempotency keys prevent messages from ever being sent twice, even if the worker process restarts.
- **Live 2-Column Dashboard**: High-contrast modern UI featuring live **WhatsApp Web State** monitoring, **System Web State** (network online/offline check), active daily schedules, and today's dispatch timeline.
- **100% Private Local Session Storage**: Your WhatsApp login session stays encrypted locally in `worker/data/whatsapp-profile/`. No data or tokens are ever sent to remote servers.

---

## 🛠️ Technology Stack

- **Frontend Dashboard**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons
- **Backend API**: Node.js, Express, TypeScript, Zod Validation
- **Automation Engine**: Playwright (Chromium persistent context)
- **Database**: SQLite (`better-sqlite3` with WAL mode)
- **Timezone & Date Math**: Luxon

---

## 📂 Project Architecture

```
whatsflow-whatsapp-scheduler/
├── frontend/       # Next.js 14 App Router Dashboard UI (Port 3000)
├── backend/        # Express REST API Server (Port 4000)
├── worker/         # Playwright Chromium Engine & Task Poller
├── shared/         # Shared TypeScript Types, DB Repositories & Luxon Math
├── database/       # SQLite database file (sqlite.db)
├── worker/data/    # Saved WhatsApp Web session profile [GITIGNORED]
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js**: `v18.0.0` or higher (Node `v20.x` recommended)
- **npm**: `v9.0.0` or higher
- **Operating System**: macOS, Linux, or Windows

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/VaibhavPatel91/whatsflow-whatsapp-scheduler.git
cd whatsflow-whatsapp-scheduler
npm install
```


### 2. Install Playwright Chromium

```bash
npx playwright install chromium
```

### 3. Run WhatsFlow

Start the dashboard, API server, and automation worker together in one command:

```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 📱 Initial WhatsApp Web QR Setup

1. Open the dashboard at `http://localhost:3000`.
2. On the left panel under **WhatsApp Web State**, click **Verify Live Session in Browser**.
3. A Chromium browser window will open to `https://web.whatsapp.com`.
4. Open WhatsApp on your phone &rarr; **Linked Devices** &rarr; **Link a Device**.
5. Scan the QR code shown in the Chromium window.
6. Once logged in, your session is saved locally in `./worker/data/whatsapp-profile/`. You do not need to scan QR code again!

---

## 🔒 Privacy & Security

- **Local Storage Only**: All database records and session files stay locally on your computer.
- **Git Safety**: The `worker/data/whatsapp-profile/` directory containing your session cookies is strictly `.gitignore` protected.
- **No Remote Calls**: WhatsFlow does not communicate with external analytics or third-party cloud services.

---

## 📄 License

Personal & Educational Use Only.
