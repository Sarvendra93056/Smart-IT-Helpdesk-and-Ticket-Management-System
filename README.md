# NexusIT | Smart Enterprise IT Helpdesk & SLA Management System

An enterprise-grade IT Helpdesk and Ticket Management System built for companies to seamlessly manage employee IT problems across hardware, network, software, identity, and security domains.

Featuring **AI-powered categorization & runbook matching**, **real-time SLA tracking with breach alerts**, **multi-tier team workload balancing**, and **executive analytics & reporting**.

---

## 🌟 Key Highlights & Features

### 1. Employee Incident Reporting & Self-Service
- **Multi-domain IT Tickets**: Raise tickets for laptop hardware, corporate Wi-Fi/VPN networks, developer software, Okta SSO/MFA access, and security threats.
- **Device & Location Asset Tagging**: Associate tickets with corporate asset tags (e.g. `IT-MBP-9041`) and office branches (NY HQ, SF Tech Hub, London, Remote).
- **Interactive AI Self-Service Solver**: While typing a ticket description, the real-time AI engine identifies symptoms and surfaces verified runbook steps. Employees can click **"This solved my problem!"** to resolve instantly without human agent overhead.

### 2. AI Categorization & Resolution Engine
- **Automated Triage**: Analyzes ticket title & description for technical keywords, symptoms, and urgency indicators.
- **Calculates**:
  - Primary Category & Granular Subcategory (e.g. *Laptop Battery & Power*, *VPN & Remote Gateway*).
  - Confidence Score (75%–99%).
  - SLA Urgency & Recommended Priority (`P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`).
  - Auto-routing to specialized support teams.
- **AI Agent Co-Pilot**:
  - Curated diagnostic checklists for IT engineers.
  - One-click copyable terminal/PowerShell diagnostic commands.
  - One-click **"Insert AI Draft Reply"** into communication threads.

### 3. Enterprise SLA Tracking & Breach Alerts
- **Configurable SLA Policies**:
  - **P1 - Critical**: 15 min first response, 2 hr resolution (24/7 on-call tier).
  - **P2 - High**: 1 hr first response, 8 hr resolution (same-day).
  - **P3 - Medium**: 4 hr first response, 24 hr resolution (standard defect).
  - **P4 - Low**: 8 hr first response, 48 hr resolution (general inquiry).
- **Live SLA Timers**: Visual color-coded badges (`Within SLA` green, `At Risk` amber pulsing, `Breached` glowing red with duration).
- **Automated Escalation**: Breached tickets automatically escalate to Tier 3 Leads with audit log entries.

### 4. Admin Dispatch & Support Team Workload
- **Tiered Engineering Pods**:
  - *Tier 1 - Global Service Desk* (First response, triage, software licenses)
  - *Tier 2 - Hardware & Peripherals* (MacBook repairs, Dell workstations, CalDigit docks, depot swaps)
  - *Tier 3 - Network & Cloud Infrastructure* (Cisco AnyConnect, 802.1X Wi-Fi, DNS, Gateways)
  - *Tier 3 - Identity, Access & Security (IAM)* (Okta SSO, Duo MFA, AWS IAM, phishing triage)
- **Intelligent Load Balancing**: View active tickets per agent to dispatch tickets to least-loaded specialists.
- **Internal Private Notes**: Support agents can record internal diagnostic notes (highlighted in gold) hidden from the employee.

### 5. SLA Analytics & Reporting Dashboard
- **Executive KPI Cards**: SLA Compliance Rate (%), Total Tickets, Active Breaches, Avg First Response Time, Avg Resolution Time, and CSAT Score.
- **Category & Priority Distributions**: Visual breakdown charts.
- **Active SLA Breach Alert Table**: Instant jump-to-triage for at-risk tickets.
- **CSV Data Export**: One-click download of full enterprise audit records for compliance reporting.

### 6. Interactive Demo Persona Switcher
Switch personas in 1-click via the top navigation bar without logging in or out:
- 👑 **Marcus Vance** (IT Operations Director / Admin)
- 🛠️ **David Kim** (Tier 3 Network Specialist / Agent)
- 🛠️ **Priya Patel** (Tier 2 Hardware Specialist / Agent)
- 👤 **Sarah Chen** (Marketing Designer / Requester)
- 👤 **James Wilson** (Software Engineer / Requester)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS (Enterprise Design Tokens, Glassmorphism, Micro-animations), Lucide Icons.
- **Backend**: Node.js, Express, RESTful APIs, JWT Authentication, Bcrypt.
- **Database**:
  - **SQLite (`better-sqlite3`)**: Runs out of the box with zero external dependencies, WAL mode, foreign keys, and pre-seeded enterprise mock data.
  - **PostgreSQL Ready**: Full schema and seed migrations in `server/init-postgres.sql` and `pg` connection pool. Simply specify `DATABASE_URL` to connect to PostgreSQL.
- **AI Engine**: Rule-based NLP categorization engine + Runbook matcher + Optional Gemini API connector.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Installation
From the root directory:
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 3. Launch the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:5001](http://localhost:5001)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🐘 Optional: PostgreSQL Setup

To run against a PostgreSQL database instead of the embedded SQLite database:

1. Create and populate the database using the provided schema:
   ```bash
   psql -U postgres -f server/init-postgres.sql
   ```
2. Set your environment variable in `server/.env`:
   ```env
   DATABASE_URL=postgres://postgres:password@localhost:5432/it_helpdesk
   PORT=5001
   ```
3. Restart the server. The connection layer will automatically detect `DATABASE_URL` and route all queries through PostgreSQL!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tickets` | List tickets with filters (`search`, `category`, `status`, `priority`, `sla_status`) |
| `GET` | `/api/tickets/:id` | Full ticket details, SLA metrics, timeline events, and messages |
| `POST` | `/api/tickets` | Create ticket with auto-AI classification and calculated SLA deadlines |
| `PATCH` | `/api/tickets/:id/assign` | Assign team and specialist agent |
| `PATCH` | `/api/tickets/:id/status` | Update status (`In Progress`, `Pending User`, `Resolved`, `Closed`) |
| `PATCH` | `/api/tickets/:id/priority`| Escalate priority and recalculate SLA deadlines |
| `POST` | `/api/tickets/:id/messages` | Post comment (public) or private internal note |
| `POST` | `/api/tickets/:id/csat` | Submit 1–5 star CSAT rating and feedback |
| `POST` | `/api/ai/classify` | Real-time symptom triage and runbook suggestion |
| `GET` | `/api/analytics/dashboard`| Executive KPIs, SLA compliance rate, category breakdowns |
| `GET` | `/api/analytics/export` | Download complete audit report as CSV |
| `GET` | `/api/teams` | List support teams and active incident workload |
| `GET` | `/api/kb` | Search verified knowledge base playbooks |
| `POST` | `/api/auth/switch` | Instant demo persona switcher |
