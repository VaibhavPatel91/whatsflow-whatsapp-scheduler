# WhatsApp Personal Group Message Scheduler
## AI Code Generation Specification

### 1. Project Goal

Build a complete local web application that lets the user schedule exactly two pre-written WhatsApp messages per day for a selected WhatsApp group, with a configurable gap (default: 2 hours), without using the WhatsApp Business API and without requiring the user to manually click Send.

Example:

- Group: `Office Team`
- Message 1: `Good morning everyone!`
- First send time: `10:00 AM`
- Message 2: `Today's update will be shared shortly.`
- Gap: `120 minutes`
- Result:
  - 10:00 AM -> Message 1 automatically sent
  - 12:00 PM -> Message 2 automatically sent

The application must use WhatsApp Web through a persistent browser session controlled by Playwright.

IMPORTANT:
- Do not use the WhatsApp Business API.
- Do not use unofficial/modified WhatsApp clients.
- Do not implement techniques intended to bypass WhatsApp security, rate limits, CAPTCHA, or automation detection.
- The application must operate only on a WhatsApp account that the user owns/controls and groups in which the account is already a member.
- Do not implement bulk messaging, contact scraping, group discovery through private APIs, or mass unsolicited messaging.
- Show a clear warning in the UI that WhatsApp Web automation is unofficial and may cause account restrictions.
- Do not expose or store the WhatsApp session in the frontend.
- Never store a WhatsApp password. Authentication is performed by scanning the WhatsApp Web QR code.

---

# 2. Recommended Architecture

Use a monorepo:

whatsapp-scheduler/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── worker/
│       ├── src/
│       │   ├── index.ts
│       │   ├── scheduler.ts
│       │   ├── whatsapp/
│       │   │   ├── client.ts
│       │   │   ├── groupResolver.ts
│       │   │   ├── messageSender.ts
│       │   │   └── session.ts
│       │   ├── jobs/
│       │   │   └── sendMessageJob.ts
│       │   ├── services/
│       │   │   ├── scheduleService.ts
│       │   │   └── logService.ts
│       │   └── config/
│       │       └── env.ts
│       └── package.json
│
├── packages/
│   ├── database/
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── repositories/
│   │   └── package.json
│   │
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   └── ui/
│       ├── src/
│       └── package.json
│
├── data/
│   └── whatsapp-profile/
│
├── .env.example
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── .gitignore

If a simpler structure is preferable, use:

whatsapp-scheduler/
├── frontend/       # Next.js
├── backend/        # Node.js + Express
├── worker/         # Playwright + scheduler
├── database/
├── data/
│   └── whatsapp-profile/
├── .env.example
├── package.json
└── README.md

Prefer the simpler structure unless the generated code genuinely benefits from a monorepo.

---

# 3. Technology Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- shadcn/ui or a similarly clean component system

Backend:
- Node.js
- TypeScript
- Express
- Zod
- REST API

Automation:
- Playwright
- Chromium
- Persistent browser context

Database:
- Supabase/PostgreSQL

Scheduling:
- Prefer a durable job scheduler such as BullMQ + Redis if production reliability is important.
- For a simple local version, node-cron plus database polling is acceptable.
- The scheduler must survive application restarts by reloading pending schedules from the database.

---

# 4. Core Features

## 4.1 Dashboard

Create a dashboard containing:

- WhatsApp connection status
- Current scheduled message
- Today's messages
- Upcoming messages
- Recent send history
- Enable/disable automation
- Warning/status banner

Status examples:

CONNECTED
WAITING_FOR_QR
DISCONNECTED
ERROR

---

# 5. WhatsApp Connection

Create a Playwright service.

Requirements:

1. Launch Chromium using a persistent context.
2. Store browser profile under:

data/whatsapp-profile/

3. Navigate to:

https://web.whatsapp.com/

4. Detect whether the account is already authenticated.
5. If not authenticated:
   - display a QR-code/login status in the backend/UI if practical;
   - allow the user to scan the QR code using their phone.
6. Do not save passwords.
7. Reuse the persistent browser profile after restarting the worker.
8. Provide an API endpoint:

GET /api/whatsapp/status

Response example:

{
  "status": "CONNECTED"
}

Possible states:

WAITING_FOR_BROWSER
WAITING_FOR_QR
CONNECTING
CONNECTED
DISCONNECTED
ERROR

Do not expose the actual browser session or filesystem path to the frontend.

---

# 6. Group Selection

The user must be able to select a WhatsApp group.

Preferred flow:

1. User clicks "Connect WhatsApp".
2. Once WhatsApp Web is connected, retrieve only the available group chats needed for selection.
3. Display group names in a searchable dropdown.
4. User selects one group.
5. Store a stable internal identifier if one is available and safe to use.
6. Also store the group display name as a human-readable fallback.
7. Before sending, verify that the target chat still corresponds to the selected group.

Do not scrape phone contacts or private information unnecessarily.

If WhatsApp Web's UI changes, keep selectors centralized in one module so they can be updated without rewriting the application.

Create:

whatsapp/groupResolver.ts

Responsibilities:

- search for group
- resolve selected group
- verify target group
- return target chat/page handle

---

# 7. Message Scheduling

Each schedule must contain:

id
group_id
group_name
message_1
message_2
first_send_time
gap_minutes
timezone
enabled
created_at
updated_at

Default:

gap_minutes = 120

Validation:

- message_1 required
- message_2 required
- group required
- first_send_time required
- gap_minutes >= 1
- timezone required
- enabled boolean

The second message time must be calculated automatically:

second_send_time = first_send_time + gap_minutes

Example:

first_send_time = 10:00
gap_minutes = 120

second_send_time = 12:00

Handle midnight correctly.

Example:

23:30 + 120 minutes = 01:30 next day.

---

# 8. Scheduling Rules

The user can configure:

- selected group
- message 1
- message 2
- first send time
- gap
- timezone
- enabled/disabled

Default timezone:

Asia/Kolkata

Do not hard-code timezone logic throughout the application. Use a proper timezone library such as Luxon or date-fns-tz.

The scheduler must:

1. Load enabled schedules from database.
2. Calculate the next occurrence.
3. Create/send job 1.
4. Calculate job 2.
5. Send job 2 after the configured gap.
6. Record success/failure.
7. Automatically schedule the next day's messages.

Avoid duplicate sends after application restarts.

Use an idempotency key such as:

scheduleId + YYYY-MM-DD + messageNumber

Before sending, check whether that job was already successfully sent.

---

# 9. Message Sending

Create:

whatsapp/messageSender.ts

Responsibilities:

- resolve target group
- open/select the group
- locate message input
- type the message
- send it automatically
- confirm that sending succeeded
- return a structured result

Example result:

{
  "success": true,
  "scheduleId": "...",
  "messageNumber": 1,
  "sentAt": "2026-09-03T10:00:00+05:30"
}

Failure:

{
  "success": false,
  "errorCode": "GROUP_NOT_FOUND",
  "error": "Selected group could not be found"
}

Important:

- Do not use arbitrary keyboard automation when a reliable DOM interaction is available.
- Keep selectors in a dedicated selectors module.
- Add retry logic for transient UI failures.
- Use conservative retry counts.
- Never retry indefinitely.
- If WhatsApp is disconnected, mark the job failed/pending rather than repeatedly attempting to send.
- Do not implement any anti-detection or stealth plugin.

---

# 10. Send Verification

After attempting to send a message, verify success using reliable UI state.

Possible verification methods:

- message appears in the target chat
- composer clears
- message element becomes visible
- timestamp/message state indicates sent

Do not simply assume that calling click() means success.

If verification fails:

- capture error information
- optionally save a screenshot to logs/debug/
- mark the job as failed
- show the failure in the dashboard

Do not send duplicate messages just because verification is uncertain.

Use an idempotency record before retrying.

---

# 11. Database Schema

Create PostgreSQL/Supabase tables.

## schedules

id UUID primary key
group_id TEXT NOT NULL
group_name TEXT NOT NULL
message_1 TEXT NOT NULL
message_2 TEXT NOT NULL
first_send_time TIME NOT NULL
gap_minutes INTEGER NOT NULL DEFAULT 120
timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata'
enabled BOOLEAN NOT NULL DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()

## scheduled_jobs

id UUID primary key
schedule_id UUID references schedules(id)
run_date DATE NOT NULL
message_number INTEGER NOT NULL
scheduled_at TIMESTAMPTZ NOT NULL
status TEXT NOT NULL
idempotency_key TEXT UNIQUE NOT NULL
attempts INTEGER DEFAULT 0
sent_at TIMESTAMPTZ NULL
error_message TEXT NULL
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()

Allowed status:

PENDING
PROCESSING
SENT
FAILED
CANCELLED

## whatsapp_connection

id UUID primary key
status TEXT
last_connected_at TIMESTAMPTZ
last_error TEXT
updated_at TIMESTAMPTZ

Do not store WhatsApp authentication tokens in the database.

The browser profile remains local/private.

---

# 12. API Endpoints

## WhatsApp

GET /api/whatsapp/status

POST /api/whatsapp/connect

POST /api/whatsapp/disconnect

GET /api/whatsapp/groups

The groups endpoint should return only the minimum information required:

[
  {
    "id": "internal-id",
    "name": "Office Team"
  }
]

## Schedules

GET /api/schedules

POST /api/schedules

GET /api/schedules/:id

PATCH /api/schedules/:id

DELETE /api/schedules/:id

POST /api/schedules/:id/enable

POST /api/schedules/:id/disable

## Jobs/history

GET /api/jobs

GET /api/jobs/:id

---

# 13. Schedule Creation Example

POST /api/schedules

Request:

{
  "groupId": "group-id",
  "groupName": "Office Team",
  "message1": "Good morning everyone!",
  "message2": "Today's update will be shared shortly.",
  "firstSendTime": "10:00",
  "gapMinutes": 120,
  "timezone": "Asia/Kolkata",
  "enabled": true
}

The backend should create:

Job 1:
10:00

Job 2:
12:00

Both jobs receive unique idempotency keys.

---

# 14. Frontend Pages

## /dashboard

Show:

- WhatsApp status
- Schedule summary
- Today's schedule
- Upcoming send
- Last sent message
- Last error

## /schedule

Form:

Group:
[ Select WhatsApp Group ]

Message 1:
[ textarea ]

Message 2:
[ textarea ]

First message time:
[ time picker ]

Gap:
[ 120 minutes ]

Second message:
Automatically calculated

Timezone:
[ Asia/Kolkata ]

[ Enable Schedule ]

## /history

Table:

Date
Group
Message
Scheduled Time
Status
Sent Time
Error

## /settings

- WhatsApp connection
- timezone
- default gap
- automation enable/disable
- browser/session information
- warning about unofficial WhatsApp Web automation

---

# 15. UI Requirements

Make the UI clean and professional.

Use:

- responsive layout
- cards
- tables
- status badges
- toast notifications
- confirmation dialogs
- loading states
- empty states
- error states

Do not make the UI overly complex.

Main dashboard should clearly show:

WhatsApp:
● Connected

Today's Schedule:

10:00 AM
Message 1
✓ Sent

12:00 PM
Message 2
○ Pending

---

# 16. Worker Architecture

The worker should run independently from Next.js.

Example:

worker/src/index.ts

Responsibilities:

- initialize Playwright
- initialize WhatsApp Web
- initialize scheduler
- load pending jobs
- process jobs

scheduler.ts:

- query pending jobs
- find jobs whose scheduled_at <= now
- acquire job lock
- execute send job
- update status

sendMessageJob.ts:

1. Check job status.
2. Acquire processing lock.
3. Check WhatsApp connection.
4. Resolve group.
5. Send message.
6. Verify send.
7. Update database.
8. Release lock.

---

# 17. Concurrency

Only one WhatsApp send operation should execute at a time.

Create a simple mutex/queue around WhatsApp operations.

Example:

WhatsAppQueue

send(job1)
wait
send(job2)

Never run multiple Playwright send operations simultaneously.

---

# 18. Failure Handling

Handle:

- WhatsApp disconnected
- QR required
- group renamed
- group unavailable
- browser crash
- Playwright timeout
- network failure
- database failure
- duplicate job
- message send verification failure

Use structured error codes.

Example:

WHATSAPP_NOT_CONNECTED
QR_REQUIRED
GROUP_NOT_FOUND
CHAT_OPEN_FAILED
MESSAGE_INPUT_NOT_FOUND
SEND_FAILED
SEND_UNVERIFIED
DATABASE_ERROR
DUPLICATE_JOB

---

# 19. Logging

Use structured logs.

Example:

[2026-09-03 10:00:00] INFO Scheduler started
[2026-09-03 10:00:01] INFO WhatsApp connected
[2026-09-03 10:00:02] INFO Processing job abc
[2026-09-03 10:00:04] INFO Message sent
[2026-09-03 10:00:05] INFO Job completed

Do not log:

- message contents unnecessarily
- authentication secrets
- cookies
- session files
- private contact information

---

# 20. Security

Use:

- environment variables
- server-side validation
- rate limiting on API endpoints
- CORS configuration
- Helmet
- input validation with Zod
- secure error responses

Never expose:

SUPABASE_SERVICE_ROLE_KEY
database passwords
session data
browser profile contents

The Playwright profile directory must be in .gitignore.

---

# 21. Environment Variables

Create:

.env.example

Example:

NODE_ENV=development

NEXT_PUBLIC_API_URL=http://localhost:4000

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

REDIS_URL=redis://localhost:6379

WHATSAPP_PROFILE_PATH=./data/whatsapp-profile

APP_TIMEZONE=Asia/Kolkata

LOG_LEVEL=info

Never commit the real .env file.

---

# 22. Scripts

Root package.json:

dev
dev:web
dev:backend
dev:worker
build
start
lint
typecheck

Example:

pnpm dev

should start:

- frontend
- backend
- worker

For local development, use concurrently or an equivalent tool.

---

# 23. Docker

Provide optional docker-compose.yml for:

- PostgreSQL/optional Supabase alternative
- Redis

Do not run Chromium inside Docker unless necessary.

For the first version, support local Chromium execution directly on the host machine because persistent WhatsApp Web sessions are easier to manage.

---

# 24. Browser Session Management

Use Playwright persistent context:

browserType.launchPersistentContext(profilePath, {
  headless: false
})

The user must be able to see the browser window.

Do not use headless mode by default because initial QR scanning and debugging require a visible browser.

After the user scans the QR code, reuse the same profile.

Do not delete the profile automatically.

Provide a "Clear WhatsApp Session" operation only after an explicit confirmation.

---

# 25. Playwright Selectors

IMPORTANT:

WhatsApp Web's DOM changes over time.

Do not scatter selectors across the code.

Create:

whatsapp/selectors.ts

Centralize all selectors there.

Example conceptual structure:

export const selectors = {
  searchBox: [...],
  chatList: [...],
  messageInput: [...],
  sendButton: [...],
  qrCode: [...]
}

Use multiple fallback selectors where reasonable.

Do not use brittle generated CSS class names if semantic attributes, aria labels, roles, or stable attributes are available.

If a selector cannot be verified reliably, fail safely rather than sending to the wrong chat.

---

# 26. Safety Against Wrong Group

This is critical.

Before sending:

1. Search/select the intended group.
2. Verify the currently open chat title.
3. Compare it with the stored group name.
4. Only proceed if it matches.
5. If there is ambiguity, abort the send.

Never send a message when the selected target cannot be confidently verified.

---

# 27. Scheduling Example

Suppose:

firstSendTime = 09:30
gapMinutes = 120

Then:

09:30 -> message 1
11:30 -> message 2

Next day:

09:30 -> message 1
11:30 -> message 2

If:

firstSendTime = 23:00
gapMinutes = 120

Then:

23:00 -> message 1
01:00 next day -> message 2

The database must store the exact scheduled timestamp for each job.

---

# 28. Editing a Schedule

If the user edits an enabled schedule:

1. Cancel future pending jobs for that schedule.
2. Recalculate jobs.
3. Create new pending jobs.
4. Do not modify already SENT jobs.

If the user disables the schedule:

- future PENDING jobs become CANCELLED
- already SENT jobs remain SENT

---

# 29. Duplicate Prevention

This is mandatory.

Before sending:

Check:

idempotency_key

Example:

scheduleId_2026-09-03_1

If status is SENT:

Do not send again.

If PROCESSING:

Do not start another worker for the same job.

If FAILED:

Only retry according to a controlled retry policy.

Never create duplicate messages because the worker restarted.

---

# 30. Retry Policy

Use a maximum of 2 or 3 retries for transient failures.

Do not retry:

- wrong group
- group not found
- authentication failure
- message verification failure when the actual send state is uncertain

If send state is uncertain, mark the job as:

SEND_UNVERIFIED

and require manual inspection rather than risking a duplicate.

---

# 31. Testing

Create tests for:

- schedule creation
- validation
- second time calculation
- midnight crossing
- timezone conversion
- duplicate prevention
- job state transitions
- enabling/disabling schedules
- editing schedules
- API validation
- WhatsApp disconnected state

Create Playwright integration tests with mocked/fake WhatsApp interfaces where possible.

Do not automate tests against real production WhatsApp accounts.

---

# 32. README Requirements

Generate a complete README.md containing:

1. Project overview
2. Features
3. Architecture
4. Requirements
5. Installation
6. Environment setup
7. Supabase database setup
8. Redis setup
9. Running frontend/backend/worker
10. WhatsApp Web QR setup
11. Creating a schedule
12. How automatic sending works
13. Troubleshooting
14. Security
15. Limitations
16. WhatsApp automation warning

Clearly explain that WhatsApp Web browser automation is unofficial and may violate WhatsApp terms or result in account restrictions.

---

# 33. AI Code Generation Instructions

You are generating the COMPLETE project, not a prototype.

Requirements:

- TypeScript everywhere possible.
- No placeholder functions.
- No TODO comments for core functionality.
- No fake API responses.
- No mock WhatsApp implementation in the production path.
- All imports must resolve.
- All environment variables must be documented.
- Include database migrations/schema.
- Include API validation.
- Include error handling.
- Include logging.
- Include README.
- Include .gitignore.
- Include .env.example.
- Include package.json files.
- Include setup commands.
- Include complete source code.

Before finishing:

1. Check all imports.
2. Check TypeScript types.
3. Check package dependencies.
4. Check API routes.
5. Check database schema.
6. Check scheduler logic.
7. Check timezone calculations.
8. Check duplicate prevention.
9. Check worker restart behavior.
10. Check that WhatsApp session data is not committed.
11. Check that the wrong WhatsApp group cannot accidentally receive a message.
12. Check that there is only one active send operation at a time.

---

# 34. Preferred Development Order

Generate in this order:

Phase 1:
Project scaffolding

Phase 2:
Database schema and repositories

Phase 3:
Backend API

Phase 4:
Playwright WhatsApp connection

Phase 5:
Group selection

Phase 6:
Message sending

Phase 7:
Scheduler

Phase 8:
Idempotency/retry handling

Phase 9:
Frontend dashboard

Phase 10:
History/logging

Phase 11:
Testing

Phase 12:
README and setup documentation

---

# 35. Final Acceptance Criteria

The project is considered complete only when the following workflow works:

1. Start the application.
2. Open the dashboard.
3. Click Connect WhatsApp.
4. Playwright opens WhatsApp Web.
5. User scans QR code if required.
6. Dashboard shows CONNECTED.
7. User opens Schedule.
8. User searches/selects a WhatsApp group.
9. User enters Message 1.
10. User enters Message 2.
11. User selects 10:00 AM.
12. Gap defaults to 120 minutes.
13. UI displays:
    Message 1 -> 10:00 AM
    Message 2 -> 12:00 PM
14. User enables the schedule.
15. Backend creates two jobs.
16. At 10:00 AM, worker opens/verifies the selected group and sends Message 1 automatically.
17. Job becomes SENT.
18. At 12:00 PM, worker sends Message 2 automatically.
19. Job becomes SENT.
20. Dashboard history shows both messages.
21. Restarting the worker does not send duplicates.
22. Disabling the schedule prevents future sends.
23. Editing the schedule recalculates future jobs.
24. If WhatsApp disconnects, the application reports the problem rather than repeatedly attempting unsafe sends.

---

# 36. Important Product Decision

Do NOT build a system intended for:

- mass messaging
- hundreds/thousands of messages
- automated contact scraping
- unsolicited marketing
- bypassing WhatsApp restrictions
- CAPTCHA bypass
- fingerprint spoofing
- stealth browser automation
- modified WhatsApp clients

The intended use is a small personal scheduler for two pre-written messages per day to a group the user already participates in.

Generate the application accordingly.
